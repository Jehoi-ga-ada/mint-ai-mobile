import { toNumber } from '../api/format';
import type {
  AccountBalance,
  CategoryTotal,
  MoneyStats,
  MoneySummary,
  TransactionView,
} from '../api/types';
import { toISODate, type DateRange } from '../utils/dateRange';
import type { MoneyData } from './types';

const CURRENCY = 'IDR';

/** True when a transaction's date falls inside the (optional, inclusive) range.
 * Ported from the offline merge overlay. */
function inRange(dateStr: string, range?: DateRange): boolean {
  if (!range) {
    return true;
  }
  const day = dateStr.slice(0, 10);
  const start = toISODate(range.start ?? null);
  const end = toISODate(range.end ?? null);
  if (start && day < start) {
    return false;
  }
  if (end && day > end) {
    return false;
  }
  return true;
}

function inMonth(dateStr: string, now: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

/** Signed contribution to a balance: income adds, expense subtracts. */
function balanceDelta(t: TransactionView): number {
  const amount = toNumber(t.amount);
  return t.type === 'income' ? amount : -amount;
}

/** Filtered, newest-first ledger — replaces the server's `/money/transactions`. */
export function selectLedger(
  data: MoneyData,
  type?: 'income' | 'expense',
  range?: DateRange,
): TransactionView[] {
  return data.transactions
    .filter((t) => (!type || t.type === type) && inRange(t.date, range))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Account balances + total cash + this-month income/expense — replaces the
 * server's `/money/summary`, computed entirely from local transactions. */
export function selectSummary(data: MoneyData, now: Date = new Date()): MoneySummary {
  const balances = new Map<string, number>(data.accounts.map((a) => [a.id, 0]));
  let totalCash = 0;
  let monthIncome = 0;
  let monthExpense = 0;

  for (const t of data.transactions) {
    const delta = balanceDelta(t);
    if (balances.has(t.account_id)) {
      balances.set(t.account_id, balances.get(t.account_id)! + delta);
    }
    totalCash += delta;
    if (inMonth(t.date, now)) {
      if (t.type === 'income') {
        monthIncome += toNumber(t.amount);
      } else {
        monthExpense += toNumber(t.amount);
      }
    }
  }

  const accounts: AccountBalance[] = data.accounts.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    currency: a.currency,
    balance: balances.get(a.id) ?? 0,
  }));

  return {
    currency: CURRENCY,
    total_cash: totalCash,
    month_income: monthIncome,
    month_expense: monthExpense,
    accounts,
  };
}

/** Per-category breakdown for one type within a range — replaces `/money/stats`.
 * Ported from the offline merge by-category aggregation. */
export function selectStats(
  data: MoneyData,
  type: 'income' | 'expense',
  range?: DateRange,
): MoneyStats {
  const totals = new Map<string, { name: string; total: number }>();

  for (const t of data.transactions) {
    if (t.type !== type || !inRange(t.date, range)) {
      continue;
    }
    const key = t.category_id ?? t.category_name;
    const existing = totals.get(key) ?? { name: t.category_name, total: 0 };
    totals.set(key, { name: existing.name, total: existing.total + toNumber(t.amount) });
  }

  const by_category: CategoryTotal[] = Array.from(totals.entries())
    .map(([key, v]) => ({ category_id: key, category_name: v.name, total: v.total }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const total = by_category.reduce((sum, c) => sum + toNumber(c.total), 0);

  return { type, currency: CURRENCY, total, by_category };
}
