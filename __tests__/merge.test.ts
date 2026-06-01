import { applyOpsToStats, applyOpsToSummary, mergeTransactions } from '../src/offline/merge';
import type { PendingOp } from '../src/offline/outbox';
import type {
  AddTransaction,
  MoneyStats,
  MoneySummary,
  TransactionView,
} from '../src/api/types';

function view(overrides: Partial<TransactionView>): TransactionView {
  return {
    id: 't1',
    date: '2026-06-10T00:00:00.000Z',
    type: 'expense',
    amount: '100',
    currency: 'IDR',
    note: null,
    category_id: 'food',
    category_name: 'Food',
    account_id: 'bca',
    account_name: 'BCA',
    ...overrides,
  };
}

function payload(overrides: Partial<AddTransaction>): AddTransaction {
  return {
    date: '2026-06-12T00:00:00.000Z',
    type: 'expense',
    amount: 50,
    currency: 'IDR',
    account_id: 'bca',
    category_id: 'food',
    note: null,
    ...overrides,
  };
}

function op(overrides: Partial<PendingOp>): PendingOp {
  return {
    clientId: 'c1',
    kind: 'create',
    createdAt: '2026-06-12T00:00:00.000Z',
    status: 'pending',
    ...overrides,
  };
}

const NOW = new Date('2026-06-15T12:00:00.000Z');

describe('mergeTransactions', () => {
  it('prepends offline creates, marks them pending, and sorts newest-first', () => {
    const server = [view({ id: 's1', date: '2026-06-09T00:00:00.000Z' })];
    const ops = [op({ clientId: 'c1', payload: payload({ date: '2026-06-12T00:00:00.000Z' }) })];

    const result = mergeTransactions(server, ops);

    expect(result.map((t) => t.id)).toEqual(['c1', 's1']);
    expect(result[0].pending).toBe(true);
    expect(result[1].pending).toBeUndefined();
  });

  it('hides server rows that have a pending delete', () => {
    const server = [view({ id: 's1' }), view({ id: 's2' })];
    const ops = [op({ clientId: 'd1', kind: 'delete', targetId: 's1' })];

    const result = mergeTransactions(server, ops);

    expect(result.map((t) => t.id)).toEqual(['s2']);
  });

  it('applies a pending update onto the server row while keeping its id', () => {
    const server = [view({ id: 's1', amount: '100', category_name: 'Food' })];
    const ops = [
      op({
        clientId: 'u1',
        kind: 'update',
        targetId: 's1',
        payload: payload({ amount: 999, category_id: 'fun', date: '2026-06-10T00:00:00.000Z' }),
        display: { categoryName: 'Fun', accountName: 'BCA' },
      }),
    ];

    const result = mergeTransactions(server, ops);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('s1');
    expect(result[0].amount).toBe(999);
    expect(result[0].category_name).toBe('Fun');
    expect(result[0].pending).toBe(true);
  });

  it('filters creates by type and date range', () => {
    const ops = [
      op({ clientId: 'a', payload: payload({ type: 'expense', date: '2026-06-12T00:00:00.000Z' }) }),
      op({ clientId: 'b', payload: payload({ type: 'income', date: '2026-06-12T00:00:00.000Z' }) }),
      op({ clientId: 'c', payload: payload({ type: 'expense', date: '2026-01-01T00:00:00.000Z' }) }),
    ];

    const result = mergeTransactions([], ops, {
      type: 'expense',
      range: { start: new Date('2026-06-01'), end: new Date('2026-06-30') },
    });

    expect(result.map((t) => t.id)).toEqual(['a']);
  });
});

describe('applyOpsToSummary', () => {
  const server: MoneySummary = {
    currency: 'IDR',
    total_cash: '1000',
    month_income: '0',
    month_expense: '0',
    accounts: [{ id: 'bca', name: 'BCA', type: 'bank', currency: 'IDR', balance: '1000' }],
  };

  it('subtracts a pending expense from balance, total cash, and this-month expense', () => {
    const ops = [op({ payload: payload({ type: 'expense', amount: 200, date: NOW.toISOString() }) })];

    const result = applyOpsToSummary(server, ops, NOW);

    expect(result.accounts[0].balance).toBe(800);
    expect(result.total_cash).toBe(800);
    expect(result.month_expense).toBe(200);
    expect(result.month_income).toBe(0);
  });

  it('reverts the original effect for a delete op', () => {
    const ops = [
      op({
        kind: 'delete',
        targetId: 's1',
        original: view({ type: 'income', amount: '300', date: NOW.toISOString() }),
      }),
    ];

    const result = applyOpsToSummary(server, ops, NOW);

    expect(result.total_cash).toBe(700); // 1000 - 300 income removed
    expect(result.month_income).toBe(-300);
  });

  it('ignores ops that have hard-failed (error status)', () => {
    const ops = [op({ status: 'error', payload: payload({ amount: 999 }) })];

    const result = applyOpsToSummary(server, ops, NOW);

    expect(result.total_cash).toBe(1000);
  });
});

describe('applyOpsToStats', () => {
  const server: MoneyStats = {
    type: 'expense',
    currency: 'IDR',
    total: '150',
    by_category: [{ category_id: 'food', category_name: 'Food', total: '150' }],
  };
  const range = { start: new Date('2026-06-01'), end: new Date('2026-06-30') };

  it('adds a matching pending expense into its category total', () => {
    const ops = [op({ payload: payload({ category_id: 'food', amount: 50 }), display: { categoryName: 'Food', accountName: 'BCA' } })];

    const result = applyOpsToStats(server, ops, { type: 'expense', range });

    expect(result.by_category[0]).toMatchObject({ category_name: 'Food', total: 200 });
    expect(result.total).toBe(200);
  });

  it('ignores income ops when summarizing expenses', () => {
    const ops = [op({ payload: payload({ type: 'income', amount: 500 }) })];

    const result = applyOpsToStats(server, ops, { type: 'expense', range });

    expect(result.total).toBe(150);
  });

  it('drops a category that nets to zero after a delete', () => {
    const ops = [
      op({
        kind: 'delete',
        targetId: 's1',
        original: view({ type: 'expense', category_id: 'food', amount: '150' }),
      }),
    ];

    const result = applyOpsToStats(server, ops, { type: 'expense', range });

    expect(result.by_category).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
