import { toNumber } from '../../api/format';
import { selectLedger, selectSummary } from '../../money/selectors';
import type { MoneyData } from '../../money/types';

/** Money lives only on this device, so the assistant can't read it through a
 * server tool — instead each chat request carries a compact JSON summary. */

const RECENT_TXN_COUNT = 30;
/** Server caps money_context at 20k chars; stay safely under it. */
const MAX_CONTEXT_CHARS = 18_000;

export function buildMoneyContext(data: MoneyData, now: Date = new Date()): string {
  const summary = selectSummary(data, now);

  const context = {
    currency: 'IDR',
    total_cash: summary.total_cash,
    this_month: { income: summary.month_income, expense: summary.month_expense },
    accounts: summary.accounts.map((a) => ({ name: a.name, balance: a.balance })),
    recent_transactions: selectLedger(data)
      .slice(0, RECENT_TXN_COUNT)
      .map((t) => ({
        date: t.date.slice(0, 10),
        type: t.type,
        amount: toNumber(t.amount),
        category: t.category_name,
        account: t.account_name,
        note: t.note || undefined,
      })),
  };

  const json = JSON.stringify(context);
  if (json.length <= MAX_CONTEXT_CHARS) {
    return json;
  }
  // Oversized (huge notes?) — drop the ledger, keep balances and totals.
  return JSON.stringify({ ...context, recent_transactions: [] });
}
