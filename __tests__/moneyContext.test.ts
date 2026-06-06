import { buildMoneyContext } from '../src/features/assistant/moneyContext';
import type { MoneyData } from '../src/money/types';

function data(overrides: Partial<MoneyData> = {}): MoneyData {
  return {
    accounts: [{ id: 'a1', name: 'Cash', type: 'cash', currency: 'IDR', institution: null }],
    categories: [{ id: 'c1', name: 'Food', kind: 'expense' }],
    transactions: [
      {
        id: 't1',
        date: '2026-06-05',
        type: 'expense',
        amount: 50000,
        currency: 'IDR',
        note: 'lunch',
        category_id: 'c1',
        category_name: 'Food',
        account_id: 'a1',
        account_name: 'Cash',
      },
    ],
    schemaVersion: 1,
    seeded: true,
    imported: false,
    ...overrides,
  };
}

describe('buildMoneyContext', () => {
  test('summarizes balances, month totals, and recent transactions', () => {
    const context = JSON.parse(buildMoneyContext(data(), new Date('2026-06-06')));

    expect(context.currency).toBe('IDR');
    expect(context.total_cash).toBe(-50000);
    expect(context.this_month).toEqual({ income: 0, expense: 50000 });
    expect(context.accounts).toEqual([{ name: 'Cash', balance: -50000 }]);
    expect(context.recent_transactions).toEqual([
      {
        date: '2026-06-05',
        type: 'expense',
        amount: 50000,
        category: 'Food',
        account: 'Cash',
        note: 'lunch',
      },
    ]);
  });

  test('drops the ledger when the payload would exceed the server cap', () => {
    const huge = data({
      transactions: Array.from({ length: 30 }, (_, i) => ({
        id: `t${i}`,
        date: '2026-06-05',
        type: 'expense' as const,
        amount: 1000,
        currency: 'IDR',
        note: 'x'.repeat(900),
        category_id: 'c1',
        category_name: 'Food',
        account_id: 'a1',
        account_name: 'Cash',
      })),
    });

    const context = JSON.parse(buildMoneyContext(huge, new Date('2026-06-06')));

    expect(context.recent_transactions).toEqual([]);
    expect(context.total_cash).toBeDefined();
  });
});
