import { api } from '../api/client';
import type { Account, Category, TransactionView } from '../api/types';
import { useMoneyStore } from './moneyStore';

/** Pull a signed-in user's existing server money into the local store exactly
 * once. Called after a successful sign-in. Best-effort: if the user is offline
 * or a request fails, `imported` stays false so it retries on the next sign-in.
 * Summary is not fetched — balances are derived locally from the transactions. */
export async function importServerMoneyOnce(): Promise<void> {
  if (useMoneyStore.getState().imported) {
    return;
  }

  try {
    const [accounts, categories, transactions] = await Promise.all([
      api.get<Account[]>('/accounts').then((r) => r.data),
      api.get<Category[]>('/categories').then((r) => r.data),
      api.get<TransactionView[]>('/money/transactions').then((r) => r.data),
    ]);
    useMoneyStore.getState().importServerData({ accounts, categories, transactions });
  } catch {
    // Leave `imported` false — a later online sign-in will retry the import.
  }
}
