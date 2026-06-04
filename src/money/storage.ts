import AsyncStorage from '@react-native-async-storage/async-storage';

import type { MoneyData } from './types';

const MONEY_KEY = 'mint-ai-money';

/** Money state is persisted to disk so it survives an app restart and is fully
 * available offline. Failures are swallowed — a missing/corrupt store degrades
 * to "no persisted data" (callers seed defaults) rather than crashing. */
export async function loadMoney(): Promise<MoneyData | null> {
  try {
    const raw = await AsyncStorage.getItem(MONEY_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as MoneyData;
    if (!parsed || !Array.isArray(parsed.transactions) || !Array.isArray(parsed.accounts)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveMoney(data: MoneyData): Promise<void> {
  try {
    await AsyncStorage.setItem(MONEY_KEY, JSON.stringify(data));
  } catch {
    // Best-effort: an unwritable store still works in-memory for this session.
  }
}
