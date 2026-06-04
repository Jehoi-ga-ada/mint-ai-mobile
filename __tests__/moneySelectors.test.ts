import type { Account, Category, TransactionView } from '../src/api/types';
import { selectLedger, selectStats, selectSummary } from '../src/money/selectors';
import type { MoneyData } from '../src/money/types';

const accounts: Account[] = [
  { id: 'acc-cash', name: 'Cash', type: 'cash', currency: 'IDR', institution: null },
  { id: 'acc-bca', name: 'BCA', type: 'bank', currency: 'IDR', institution: null },
];

const categories: Category[] = [
  { id: 'cat-food', name: 'Food', kind: 'expense' },
  { id: 'cat-transport', name: 'Transport', kind: 'expense' },
  { id: 'cat-salary', name: 'Salary', kind: 'income' },
];

function txn(over: Partial<TransactionView>): TransactionView {
  return {
    id: over.id ?? 'id',
    date: over.date ?? '2026-06-01',
    type: over.type ?? 'expense',
    amount: over.amount ?? 0,
    currency: 'IDR',
    note: over.note ?? null,
    category_id: over.category_id ?? 'cat-food',
    category_name: over.category_name ?? 'Food',
    account_id: over.account_id ?? 'acc-cash',
    account_name: over.account_name ?? 'Cash',
  };
}

function data(transactions: TransactionView[]): MoneyData {
  return { accounts, categories, transactions, schemaVersion: 1, seeded: true, imported: false };
}

const NOW = new Date('2026-06-15T12:00:00');

describe('selectSummary', () => {
  test('income adds and expense subtracts per account and total', () => {
    const d = data([
      txn({ id: '1', type: 'income', amount: 1000, account_id: 'acc-bca', category_id: 'cat-salary' }),
      txn({ id: '2', type: 'expense', amount: 300, account_id: 'acc-bca' }),
      txn({ id: '3', type: 'expense', amount: 50, account_id: 'acc-cash' }),
    ]);

    const summary = selectSummary(d, NOW);

    expect(summary.total_cash).toBe(650); // 1000 - 300 - 50
    const bca = summary.accounts.find((a) => a.id === 'acc-bca');
    const cash = summary.accounts.find((a) => a.id === 'acc-cash');
    expect(bca?.balance).toBe(700);
    expect(cash?.balance).toBe(-50);
    expect(summary.currency).toBe('IDR');
  });

  test('month income/expense only count the current month', () => {
    const d = data([
      txn({ id: '1', type: 'income', amount: 500, date: '2026-06-02', category_id: 'cat-salary' }),
      txn({ id: '2', type: 'expense', amount: 200, date: '2026-06-10' }),
      txn({ id: '3', type: 'expense', amount: 999, date: '2026-05-30' }), // prior month
    ]);

    const summary = selectSummary(d, NOW);

    expect(summary.month_income).toBe(500);
    expect(summary.month_expense).toBe(200);
    expect(summary.total_cash).toBe(500 - 200 - 999);
  });

  test('a transaction on a deleted/unknown account still affects total cash', () => {
    const d = data([txn({ id: '1', type: 'expense', amount: 100, account_id: 'ghost' })]);
    const summary = selectSummary(d, NOW);
    expect(summary.total_cash).toBe(-100);
    expect(summary.accounts.every((a) => a.balance === 0)).toBe(true);
  });
});

describe('selectStats', () => {
  test('aggregates by category for the requested type, sorted desc', () => {
    const d = data([
      txn({ id: '1', type: 'expense', amount: 100, category_id: 'cat-food', category_name: 'Food' }),
      txn({ id: '2', type: 'expense', amount: 250, category_id: 'cat-transport', category_name: 'Transport' }),
      txn({ id: '3', type: 'expense', amount: 50, category_id: 'cat-food', category_name: 'Food' }),
      txn({ id: '4', type: 'income', amount: 9000, category_id: 'cat-salary', category_name: 'Salary' }),
    ]);

    const stats = selectStats(d, 'expense');

    expect(stats.total).toBe(400);
    expect(stats.by_category.map((c) => [c.category_name, c.total])).toEqual([
      ['Transport', 250],
      ['Food', 150],
    ]);
  });

  test('respects the date range filter', () => {
    const d = data([
      txn({ id: '1', type: 'expense', amount: 100, date: '2026-06-05' }),
      txn({ id: '2', type: 'expense', amount: 200, date: '2026-07-05' }),
    ]);

    const stats = selectStats(d, 'expense', {
      start: new Date('2026-06-01'),
      end: new Date('2026-06-30'),
    });

    expect(stats.total).toBe(100);
  });
});

describe('selectLedger', () => {
  test('filters by type and range and sorts newest-first', () => {
    const d = data([
      txn({ id: 'a', type: 'expense', date: '2026-06-01' }),
      txn({ id: 'b', type: 'income', date: '2026-06-03', category_id: 'cat-salary' }),
      txn({ id: 'c', type: 'expense', date: '2026-06-10' }),
    ]);

    const expenses = selectLedger(d, 'expense');
    expect(expenses.map((t) => t.id)).toEqual(['c', 'a']);

    const all = selectLedger(d);
    expect(all.map((t) => t.id)).toEqual(['c', 'b', 'a']);
  });
});
