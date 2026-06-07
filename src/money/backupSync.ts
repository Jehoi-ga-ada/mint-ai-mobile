import { useEffect } from 'react';
import { create } from 'zustand';

import { api } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useNetworkStore } from '../store/networkStore';
import { useMoneyStore } from './moneyStore';
import { MONEY_SCHEMA_VERSION, type MoneyData } from './types';

/** Snapshot backup of the local Money state. The device stays the source of
 * truth: every local change uploads the whole state (debounced) whenever the
 * user is signed in and online; a pristine install restores the latest
 * snapshot right after sign-in. */

const UPLOAD_DEBOUNCE_MS = 4_000;

export type BackupStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface BackupState {
  status: BackupStatus;
  lastBackupAt: string | null;
  set: (status: BackupStatus, lastBackupAt?: string | null) => void;
}

export const useBackupStore = create<BackupState>((set) => ({
  status: 'idle',
  lastBackupAt: null,
  set: (status, lastBackupAt) =>
    set((s) => ({ status, lastBackupAt: lastBackupAt ?? s.lastBackupAt })),
}));

/** Restore only onto a pristine install — any local transactions (or a prior
 * import) mean the device already owns data and must win. */
export function shouldRestore(local: MoneyData): boolean {
  return local.transactions.length === 0 && !local.imported;
}

/** Parse a backup blob defensively; a corrupt snapshot restores nothing. */
export function parseBackup(raw: string): MoneyData | null {
  try {
    const parsed = JSON.parse(raw) as MoneyData;
    if (
      !parsed ||
      !Array.isArray(parsed.accounts) ||
      !Array.isArray(parsed.categories) ||
      !Array.isArray(parsed.transactions)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function snapshot(): string {
  const { accounts, categories, transactions, seeded, imported } = useMoneyStore.getState();
  return JSON.stringify({
    accounts,
    categories,
    transactions,
    schemaVersion: MONEY_SCHEMA_VERSION,
    seeded,
    imported,
  });
}

function canSync(): boolean {
  return useAuthStore.getState().status === 'authed' && useNetworkStore.getState().isOnline;
}

let uploadTimer: ReturnType<typeof setTimeout> | null = null;
let dirty = false;
let restoring = false;
let pendingReconcile = false;

async function upload(): Promise<void> {
  if (!canSync()) {
    return;
  }
  dirty = false;
  useBackupStore.getState().set('syncing');
  try {
    await api.put('/money/backup', {
      data: snapshot(),
      schema_version: MONEY_SCHEMA_VERSION,
    });
    useBackupStore.getState().set('synced', new Date().toISOString());
  } catch {
    dirty = true;
    useBackupStore.getState().set('error');
  }
}

function scheduleUpload(): void {
  dirty = true;
  if (!canSync()) {
    return;
  }
  if (uploadTimer) {
    clearTimeout(uploadTimer);
  }
  uploadTimer = setTimeout(() => {
    uploadTimer = null;
    upload();
  }, UPLOAD_DEBOUNCE_MS);
}

/** On sign-in: restore the server snapshot onto a pristine device, otherwise
 * push the local state up so the backup reflects this device. Must run after
 * the money store hydrates from disk — before that, the in-memory seed state
 * would falsely look pristine and a restore could be clobbered by hydrate(). */
async function reconcile(): Promise<void> {
  if (!canSync()) {
    return;
  }
  if (!useMoneyStore.getState().hydrated) {
    pendingReconcile = true;
    return;
  }
  try {
    const res = await api.get<{ data: string }>('/money/backup');
    const remote = parseBackup(res.data.data);
    if (remote && shouldRestore(useMoneyStore.getState())) {
      restoring = true;
      useMoneyStore.getState().replaceAll(remote);
      restoring = false;
      useBackupStore.getState().set('synced', new Date().toISOString());
      return;
    }
  } catch {
    // 404 (no backup yet) or network error — fall through to upload.
  }
  await upload();
}

/** Mount once, high in the tree. */
export function useMoneyBackupSync(): void {
  useEffect(() => {
    const unsubMoney = useMoneyStore.subscribe((state, prev) => {
      if (state.hydrated && !prev.hydrated && pendingReconcile) {
        pendingReconcile = false;
        reconcile();
        return;
      }
      const changed =
        state.accounts !== prev.accounts ||
        state.categories !== prev.categories ||
        state.transactions !== prev.transactions;
      if (changed && state.hydrated && !restoring) {
        scheduleUpload();
      }
    });

    const unsubAuth = useAuthStore.subscribe((state, prev) => {
      if (state.status === 'authed' && prev.status !== 'authed') {
        reconcile();
      }
    });

    const unsubNetwork = useNetworkStore.subscribe((state, prev) => {
      if (state.isOnline && !prev.isOnline && dirty) {
        scheduleUpload();
      }
    });

    // Already signed in at mount (hydrated session) — reconcile once.
    if (useAuthStore.getState().status === 'authed') {
      reconcile();
    }

    return () => {
      unsubMoney();
      unsubAuth();
      unsubNetwork();
      if (uploadTimer) {
        clearTimeout(uploadTimer);
        uploadTimer = null;
      }
    };
  }, []);
}
