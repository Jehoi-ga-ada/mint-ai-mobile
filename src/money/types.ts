import type { Account, Category, TransactionView } from '../api/types';

/** The complete on-device state of the Money Manager. This is the source of
 * truth: accounts, categories, and transactions live here (never on a server),
 * so the domain works fully offline with no account. Summary / stats / ledger
 * are derived from these arrays by the pure selectors in `selectors.ts`. */
export interface MoneyData {
  accounts: Account[];
  categories: Category[];
  /** Canonical transaction rows. `pending` is always absent/false locally —
   * every change is committed on-device immediately. */
  transactions: TransactionView[];
  /** Bumped when the persisted shape changes, to drive future migrations. */
  schemaVersion: number;
  /** First-run defaults (Cash account + starter categories) have been written. */
  seeded: boolean;
  /** A signed-in user's server money has been imported once (never re-imported). */
  imported: boolean;
}

export const MONEY_SCHEMA_VERSION = 1;
