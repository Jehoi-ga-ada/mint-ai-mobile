import { parseBackup, shouldRestore } from '../src/money/backupSync';
import type { MoneyData } from '../src/money/types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn() },
}));
jest.mock('../src/api/client', () => ({ api: { get: jest.fn(), put: jest.fn() } }));
jest.mock('../src/store/authStore', () => ({
  useAuthStore: { getState: () => ({ status: 'guest' }), subscribe: jest.fn() },
}));

function data(overrides: Partial<MoneyData> = {}): MoneyData {
  return {
    accounts: [{ id: 'a1', name: 'Cash', type: 'cash', currency: 'IDR', institution: null }],
    categories: [],
    transactions: [],
    schemaVersion: 1,
    seeded: true,
    imported: false,
    ...overrides,
  };
}

describe('shouldRestore', () => {
  test('restores onto a pristine install', () => {
    expect(shouldRestore(data())).toBe(true);
  });

  test('never restores over local transactions', () => {
    const local = data({
      transactions: [
        {
          id: 't1',
          date: '2026-06-01',
          type: 'expense',
          amount: 1,
          currency: 'IDR',
          note: null,
          category_id: 'c1',
          category_name: 'Food',
          account_id: 'a1',
          account_name: 'Cash',
        },
      ],
    });

    expect(shouldRestore(local)).toBe(false);
  });

  test('never restores over a previous import', () => {
    expect(shouldRestore(data({ imported: true }))).toBe(false);
  });
});

describe('parseBackup', () => {
  test('round-trips a valid snapshot', () => {
    const snapshot = data();

    expect(parseBackup(JSON.stringify(snapshot))).toEqual(snapshot);
  });

  test('rejects corrupt or non-snapshot JSON', () => {
    expect(parseBackup('not json')).toBeNull();
    expect(parseBackup('{"accounts": "nope"}')).toBeNull();
    expect(parseBackup('null')).toBeNull();
  });
});
