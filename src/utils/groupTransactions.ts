import { toNumber } from '../api/format';
import type { TransactionView } from '../api/types';
import { toISODate } from './dateRange';

export interface DaySection {
  key: string; // YYYY-MM-DD
  label: string; // Today / Yesterday / "Mon, 12 May"
  expense: number;
  income: number;
  data: TransactionView[];
}

function dayLabel(key: string, now: Date): string {
  if (key === toISODate(now)) {
    return 'Today';
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (key === toISODate(yesterday)) {
    return 'Yesterday';
  }
  // key is YYYY-MM-DD; render via a parsed local date.
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Group a (date-desc) transaction list into per-day sections with daily totals. */
export function groupTransactionsByDay(
  txns: TransactionView[],
  now: Date,
): DaySection[] {
  const order: string[] = [];
  const map = new Map<string, DaySection>();

  for (const t of txns) {
    const key = t.date.slice(0, 10);
    let section = map.get(key);
    if (!section) {
      section = { key, label: dayLabel(key, now), expense: 0, income: 0, data: [] };
      map.set(key, section);
      order.push(key);
    }
    section.data.push(t);
    if (t.type === 'income') {
      section.income += toNumber(t.amount);
    } else {
      section.expense += toNumber(t.amount);
    }
  }

  // Preserve input order (already date-desc), then ensure strictly desc by key.
  return order
    .map((k) => map.get(k)!)
    .sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0));
}
