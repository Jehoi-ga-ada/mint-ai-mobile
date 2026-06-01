import axios from 'axios';
import type { QueryClient } from '@tanstack/react-query';

import { api } from '../api/client';
import { useOutboxStore, type PendingOp } from './outbox';

/** A failed request is retryable when the server never gave a definitive
 * answer — no response (offline / DNS / timeout) or a transient 5xx/408/429.
 * A 4xx is a hard rejection (e.g. bad data, deleted category) and must not be
 * retried forever; it surfaces to the user instead. */
function isRetryable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return true; // unknown failure — be conservative and keep it queued
  }
  const status = error.response?.status;
  if (status === undefined) {
    return true; // network error
  }
  return status >= 500 || status === 408 || status === 429;
}

async function sendOp(op: PendingOp): Promise<void> {
  if (op.kind === 'create') {
    await api.post('/transaction/create', { ...op.payload, client_id: op.clientId });
    return;
  }
  if (op.kind === 'update') {
    await api.put(`/transaction/${op.targetId}`, op.payload);
    return;
  }
  // delete — a row that's already gone (404) counts as successfully deleted.
  try {
    await api.delete(`/transaction/${op.targetId}`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return;
    }
    throw error;
  }
}

function describe(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail ?? error.response?.data?.message;
    return typeof detail === 'string' ? detail : error.message;
  }
  return 'Sync failed';
}

let flushing = false;

/** Replay queued transactions to the backend FIFO. Single-flight: concurrent
 * calls (e.g. an enqueue racing a reconnect) collapse into one pass. A network
 * error halts the pass and leaves the rest queued for the next attempt; a hard
 * 4xx marks just that op as errored and the pass continues. */
export async function flushOutbox(queryClient: QueryClient): Promise<void> {
  if (flushing) {
    return;
  }
  const store = useOutboxStore.getState();
  const queue = store.ops.filter((o) => o.status !== 'error');
  if (queue.length === 0) {
    return;
  }

  flushing = true;
  let didWork = false;
  try {
    for (const op of queue) {
      useOutboxStore.getState().setStatus(op.clientId, 'syncing');
      try {
        await sendOp(op);
        useOutboxStore.getState().remove(op.clientId);
        didWork = true;
      } catch (error) {
        if (isRetryable(error)) {
          // Leave it queued and stop — order matters, so don't skip ahead.
          useOutboxStore.getState().setStatus(op.clientId, 'pending');
          break;
        }
        useOutboxStore.getState().setStatus(op.clientId, 'error', describe(error));
      }
    }
  } finally {
    flushing = false;
  }

  if (didWork) {
    // Pull authoritative server state; clears the optimistic overlay for synced ops.
    await queryClient.invalidateQueries({ queryKey: ['money'] });
  }
}
