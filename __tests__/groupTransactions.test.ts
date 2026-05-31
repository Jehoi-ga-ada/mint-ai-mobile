import type { TransactionView } from '../src/api/types';
import { groupTransactionsByDay } from '../src/utils/groupTransactions';

const NOW = new Date(2026, 4, 15); // 15 May 2026

function txn(date: string, type: 'income' | 'expense', amount: number): TransactionView {
  return {
    id: `${date}-${amount}`,
    date,
    type,
    amount,
    currency: 'IDR',
    note: null,
    category_id: 'c',
    category_name: 'Cat',
    account_id: 'a',
    account_name: 'Acc',
  };
}

describe('groupTransactionsByDay', () => {
  it('groups by calendar day with per-day income/expense totals', () => {
    const sections = groupTransactionsByDay(
      [
        txn('2026-05-15T10:00:00', 'expense', 100),
        txn('2026-05-15T12:00:00', 'income', 500),
        txn('2026-05-14T09:00:00', 'expense', 40),
      ],
      NOW,
    );

    expect(sections).toHaveLength(2);
    expect(sections[0].key).toBe('2026-05-15');
    expect(sections[0].expense).toBe(100);
    expect(sections[0].income).toBe(500);
    expect(sections[0].data).toHaveLength(2);
    expect(sections[1].expense).toBe(40);
  });

  it('labels today and yesterday', () => {
    const sections = groupTransactionsByDay(
      [txn('2026-05-15T10:00:00', 'expense', 1), txn('2026-05-14T10:00:00', 'expense', 1)],
      NOW,
    );
    expect(sections[0].label).toBe('Today');
    expect(sections[1].label).toBe('Yesterday');
  });

  it('sorts sections newest-first', () => {
    const sections = groupTransactionsByDay(
      [txn('2026-05-10T10:00:00', 'expense', 1), txn('2026-05-12T10:00:00', 'expense', 1)],
      NOW,
    );
    expect(sections.map((s) => s.key)).toEqual(['2026-05-12', '2026-05-10']);
  });

  it('returns empty for no transactions', () => {
    expect(groupTransactionsByDay([], NOW)).toEqual([]);
  });
});
