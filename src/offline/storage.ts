import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PendingOp } from './outbox';

const OUTBOX_KEY = 'mint-ai-outbox';

/** The outbox is persisted to disk so queued offline transactions survive an
 * app restart. Failures are swallowed — a missing/corrupt queue degrades to
 * "nothing pending" rather than crashing the app. */
export async function loadOps(): Promise<PendingOp[]> {
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as PendingOp[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveOps(ops: PendingOp[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(ops));
  } catch {
    // Best-effort: an unwritable queue still works in-memory for this session.
  }
}
