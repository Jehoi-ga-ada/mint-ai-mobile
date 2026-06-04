import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AddTransaction } from '../src/api/types';
import { useMoneyStore, type ServerMoney } from '../src/money/moneyStore';
import { defaultMoneyData } from '../src/money/seed';

jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      setItem: jest.fn(async (k: string, v: string) => {
        store[k] = v;
      }),
      getItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
      removeItem: jest.fn(async (k: string) => {
        delete store[k];
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
    },
  };
});

function addPayload(over: Partial<AddTransaction> = {}): AddTransaction {
  return {
    date: '2026-06-01',
    type: 'expense',
    amount: 100,
    currency: 'IDR',
    account_id: over.account_id ?? 'acc-1',
    category_id: over.category_id ?? 'cat-1',
    note: null,
    ...over,
  };
}

beforeEach(async () => {
  await AsyncStorage.clear();
  // Reset to a known seeded state with one account + one category for resolution.
  useMoneyStore.setState({
    accounts: [{ id: 'acc-1', name: 'Cash', type: 'cash', currency: 'IDR', institution: null }],
    categories: [{ id: 'cat-1', name: 'Food', kind: 'expense' }],
    transactions: [],
    schemaVersion: 1,
    seeded: true,
    imported: false,
    hydrated: true,
  });
});

describe('moneyStore CRUD', () => {
  test('addTransaction resolves names, appends immutably, and persists', async () => {
    const before = useMoneyStore.getState().transactions;
    const row = useMoneyStore.getState().addTransaction(addPayload());

    expect(row.category_name).toBe('Food');
    expect(row.account_name).toBe('Cash');
    const after = useMoneyStore.getState().transactions;
    expect(after).toHaveLength(1);
    expect(after).not.toBe(before); // new array, no mutation

    const raw = await AsyncStorage.getItem('mint-ai-money');
    expect(raw).toContain(row.id);
  });

  test('updateTransaction replaces the row and re-resolves names', () => {
    const row = useMoneyStore.getState().addTransaction(addPayload({ amount: 100 }));
    useMoneyStore.getState().updateTransaction(row.id, addPayload({ amount: 250 }));

    const updated = useMoneyStore.getState().transactions.find((t) => t.id === row.id);
    expect(updated?.amount).toBe(250);
    expect(useMoneyStore.getState().transactions).toHaveLength(1);
  });

  test('deleteTransaction removes the row', () => {
    const row = useMoneyStore.getState().addTransaction(addPayload());
    useMoneyStore.getState().deleteTransaction(row.id);
    expect(useMoneyStore.getState().transactions).toHaveLength(0);
  });

  test('updateAccount renames the account immutably', () => {
    const before = useMoneyStore.getState().accounts;
    useMoneyStore.getState().updateAccount('acc-1', { name: 'Wallet' });

    const after = useMoneyStore.getState().accounts;
    expect(after.find((a) => a.id === 'acc-1')?.name).toBe('Wallet');
    expect(after).not.toBe(before); // new array, no mutation
  });

  test('updateAccount refreshes denormalized account_name on existing transactions', () => {
    const row = useMoneyStore.getState().addTransaction(addPayload());
    expect(row.account_name).toBe('Cash');

    useMoneyStore.getState().updateAccount('acc-1', { name: 'Wallet' });

    const updated = useMoneyStore.getState().transactions.find((t) => t.id === row.id);
    expect(updated?.account_name).toBe('Wallet');
  });

  test('updateAccount leaves other accounts and their transactions untouched', () => {
    const other = useMoneyStore
      .getState()
      .addAccount({ name: 'BCA', type: 'bank', currency: 'IDR', institution: null });
    const row = useMoneyStore.getState().addTransaction(addPayload({ account_id: other.id }));

    useMoneyStore.getState().updateAccount('acc-1', { name: 'Wallet' });

    expect(useMoneyStore.getState().accounts.find((a) => a.id === other.id)?.name).toBe('BCA');
    const txn = useMoneyStore.getState().transactions.find((t) => t.id === row.id);
    expect(txn?.account_name).toBe('BCA');
  });

  test('addAccount and addCategory return the created record with an id', () => {
    const acc = useMoneyStore
      .getState()
      .addAccount({ name: 'BCA', type: 'bank', currency: 'IDR', institution: null });
    const cat = useMoneyStore.getState().addCategory({ name: 'Salary', kind: 'income' });
    expect(acc.id).toBeTruthy();
    expect(cat.id).toBeTruthy();
    expect(useMoneyStore.getState().accounts).toHaveLength(2);
    expect(useMoneyStore.getState().categories).toHaveLength(2);
  });
});

describe('moneyStore hydrate', () => {
  test('seeds defaults when nothing is persisted', async () => {
    await AsyncStorage.clear();
    await useMoneyStore.getState().hydrate();
    const state = useMoneyStore.getState();
    expect(state.seeded).toBe(true);
    expect(state.accounts.length).toBeGreaterThan(0);
    expect(state.categories.length).toBeGreaterThan(0);
    // The seeded defaults were written back to disk.
    expect(await AsyncStorage.getItem('mint-ai-money')).toBeTruthy();
  });

  test('restores persisted data over the seed', async () => {
    const persisted = { ...defaultMoneyData(), imported: true };
    await AsyncStorage.setItem('mint-ai-money', JSON.stringify(persisted));
    await useMoneyStore.getState().hydrate();
    expect(useMoneyStore.getState().imported).toBe(true);
  });
});

describe('importServerData', () => {
  const server: ServerMoney = {
    accounts: [
      { id: 'srv-cash', name: 'Cash', type: 'cash', currency: 'IDR', institution: null }, // dup by name+type
      { id: 'srv-bca', name: 'BCA', type: 'bank', currency: 'IDR', institution: null }, // new
    ],
    categories: [
      { id: 'srv-food', name: 'Food', kind: 'expense' }, // dup by name+kind
      { id: 'srv-salary', name: 'Salary', kind: 'income' }, // new
    ],
    transactions: [
      {
        id: 'srv-txn-1',
        date: '2026-05-01',
        type: 'expense',
        amount: 500,
        currency: 'IDR',
        note: null,
        category_id: 'srv-food',
        category_name: 'Food',
        account_id: 'srv-bca',
        account_name: 'BCA',
      },
    ],
  };

  test('unions by human identity, appends txns, and sets imported', () => {
    useMoneyStore.getState().importServerData(server);
    const state = useMoneyStore.getState();

    // Cash/Food are de-duped; BCA/Salary are added.
    expect(state.accounts.map((a) => a.name).sort()).toEqual(['BCA', 'Cash']);
    expect(state.categories.map((c) => c.name).sort()).toEqual(['Food', 'Salary']);
    expect(state.transactions.map((t) => t.id)).toContain('srv-txn-1');
    expect(state.imported).toBe(true);
  });

  test('does not duplicate server transactions on a repeat import', () => {
    useMoneyStore.getState().importServerData(server);
    useMoneyStore.getState().importServerData(server);
    const count = useMoneyStore.getState().transactions.filter((t) => t.id === 'srv-txn-1').length;
    expect(count).toBe(1);
  });
});
