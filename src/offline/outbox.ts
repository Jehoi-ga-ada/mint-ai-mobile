import uuid from 'react-native-uuid';
import { create } from 'zustand';

import type { AddTransaction, TransactionView } from '../api/types';
import { loadOps, saveOps } from './storage';

export type OpKind = 'create' | 'update' | 'delete';
export type OpStatus = 'pending' | 'syncing' | 'error';

/** Display names captured at enqueue time so the ledger can render a pending
 * transaction without resolving category/account ids over the network. */
export interface OpDisplay {
  categoryName: string;
  accountName: string;
}

/** A money-transaction mutation captured locally and replayed to the backend by
 * the sync engine. Carries enough data (payload + display + original) to render
 * the ledger and recompute balances/stats offline without a round-trip.
 *
 * Coalescing invariant: `create` ops are standalone (their `clientId` is the
 * synthetic id of the offline-created row); `update`/`delete` ops only ever
 * target a real server id. Editing or deleting a not-yet-synced create mutates
 * or removes that create op in place — so the queue never references a temp id. */
export interface PendingOp {
  clientId: string;
  kind: OpKind;
  payload?: AddTransaction;
  display?: OpDisplay;
  targetId?: string;
  original?: TransactionView;
  createdAt: string;
  status: OpStatus;
  error?: string;
}

interface OutboxState {
  ops: PendingOp[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  enqueueCreate: (payload: AddTransaction, display: OpDisplay) => string;
  enqueueUpdate: (
    targetId: string,
    payload: AddTransaction,
    display: OpDisplay,
    original?: TransactionView,
  ) => void;
  enqueueDelete: (targetId: string, original?: TransactionView) => void;
  setStatus: (clientId: string, status: OpStatus, error?: string) => void;
  remove: (clientId: string) => void;
  retryErrors: () => void;
}

function newId(): string {
  return uuid.v4() as string;
}

function nowIso(): string {
  return new Date().toISOString();
}

/** Persist after every mutation; the in-memory state is always the source of
 * truth for this session, disk is the durable backup. */
function commit(set: (ops: PendingOp[]) => void, ops: PendingOp[]): void {
  set(ops);
  saveOps(ops);
}

export const useOutboxStore = create<OutboxState>((set, get) => ({
  ops: [],
  hydrated: false,

  hydrate: async () => {
    const persisted = await loadOps();
    // A 'syncing' status only makes sense mid-flush; reset stragglers so a crash
    // during sync doesn't strand an op.
    const ops = persisted.map((op) =>
      op.status === 'syncing' ? { ...op, status: 'pending' as const } : op,
    );
    set({ ops, hydrated: true });
  },

  enqueueCreate: (payload, display) => {
    const clientId = newId();
    const op: PendingOp = {
      clientId,
      kind: 'create',
      payload,
      display,
      createdAt: nowIso(),
      status: 'pending',
    };
    commit((ops) => set({ ops }), [...get().ops, op]);
    return clientId;
  },

  enqueueUpdate: (targetId, payload, display, original) => {
    const ops = get().ops;
    const createIndex = ops.findIndex(
      (o) => o.kind === 'create' && o.clientId === targetId,
    );

    // Editing a not-yet-synced offline create → update that create in place.
    if (createIndex >= 0) {
      const next = ops.map((o, i) =>
        i === createIndex ? { ...o, payload, display, status: 'pending' as const } : o,
      );
      commit((v) => set({ ops: v }), next);
      return;
    }

    // Otherwise it's an edit of a server row — replace any prior pending update.
    const op: PendingOp = {
      clientId: newId(),
      kind: 'update',
      targetId,
      payload,
      display,
      original,
      createdAt: nowIso(),
      status: 'pending',
    };
    const next = ops.filter((o) => !(o.kind === 'update' && o.targetId === targetId));
    commit((v) => set({ ops: v }), [...next, op]);
  },

  enqueueDelete: (targetId, original) => {
    const ops = get().ops;
    const createIndex = ops.findIndex(
      (o) => o.kind === 'create' && o.clientId === targetId,
    );

    // Deleting a not-yet-synced offline create → drop it; it never reaches the server.
    if (createIndex >= 0) {
      const next = ops.filter((_, i) => i !== createIndex);
      commit((v) => set({ ops: v }), next);
      return;
    }

    // Deleting a server row — supersede any pending edit of the same row.
    const op: PendingOp = {
      clientId: newId(),
      kind: 'delete',
      targetId,
      original,
      createdAt: nowIso(),
      status: 'pending',
    };
    const next = ops.filter((o) => o.targetId !== targetId);
    commit((v) => set({ ops: v }), [...next, op]);
  },

  setStatus: (clientId, status, error) => {
    const next = get().ops.map((o) =>
      o.clientId === clientId ? { ...o, status, error } : o,
    );
    commit((v) => set({ ops: v }), next);
  },

  remove: (clientId) => {
    const next = get().ops.filter((o) => o.clientId !== clientId);
    commit((v) => set({ ops: v }), next);
  },

  retryErrors: () => {
    const next = get().ops.map((o) =>
      o.status === 'error' ? { ...o, status: 'pending' as const, error: undefined } : o,
    );
    commit((v) => set({ ops: v }), next);
  },
}));

/** Count of changes not yet confirmed by the backend (pending or syncing). */
export function pendingCount(ops: PendingOp[]): number {
  return ops.filter((o) => o.status !== 'error').length;
}

export function errorCount(ops: PendingOp[]): number {
  return ops.filter((o) => o.status === 'error').length;
}
