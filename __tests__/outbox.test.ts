jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-uuid', () => {
  let mockCounter = 0;
  return {
    __esModule: true,
    default: { v4: () => `id-${++mockCounter}` },
  };
});

import type { AddTransaction, TransactionView } from '../src/api/types';
import { errorCount, pendingCount, useOutboxStore } from '../src/offline/outbox';

const display = { categoryName: 'Food', accountName: 'BCA' };

function payload(overrides: Partial<AddTransaction> = {}): AddTransaction {
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

function reset() {
  useOutboxStore.setState({ ops: [], hydrated: true });
}

describe('outbox coalescing', () => {
  beforeEach(reset);

  it('enqueues a create and returns its client id', () => {
    const clientId = useOutboxStore.getState().enqueueCreate(payload(), display);
    const ops = useOutboxStore.getState().ops;

    expect(ops).toHaveLength(1);
    expect(ops[0]).toMatchObject({ clientId, kind: 'create', status: 'pending' });
  });

  it('editing a not-yet-synced create mutates it in place (no extra op)', () => {
    const clientId = useOutboxStore.getState().enqueueCreate(payload({ amount: 50 }), display);

    useOutboxStore.getState().enqueueUpdate(clientId, payload({ amount: 99 }), display);

    const ops = useOutboxStore.getState().ops;
    expect(ops).toHaveLength(1);
    expect(ops[0].kind).toBe('create');
    expect(ops[0].payload?.amount).toBe(99);
  });

  it('deleting a not-yet-synced create drops it entirely', () => {
    const clientId = useOutboxStore.getState().enqueueCreate(payload(), display);

    useOutboxStore.getState().enqueueDelete(clientId);

    expect(useOutboxStore.getState().ops).toHaveLength(0);
  });

  it('editing a server row twice keeps a single update op', () => {
    useOutboxStore.getState().enqueueUpdate('server-1', payload({ amount: 10 }), display);
    useOutboxStore.getState().enqueueUpdate('server-1', payload({ amount: 20 }), display);

    const ops = useOutboxStore.getState().ops;
    expect(ops).toHaveLength(1);
    expect(ops[0].kind).toBe('update');
    expect(ops[0].payload?.amount).toBe(20);
  });

  it('deleting a server row supersedes a pending edit of that row', () => {
    useOutboxStore.getState().enqueueUpdate('server-1', payload(), display);

    useOutboxStore
      .getState()
      .enqueueDelete('server-1', { id: 'server-1' } as TransactionView);

    const ops = useOutboxStore.getState().ops;
    expect(ops).toHaveLength(1);
    expect(ops[0].kind).toBe('delete');
    expect(ops[0].targetId).toBe('server-1');
  });

  it('counts pending vs errored separately', () => {
    const a = useOutboxStore.getState().enqueueCreate(payload(), display);
    useOutboxStore.getState().enqueueCreate(payload(), display);
    useOutboxStore.getState().setStatus(a, 'error', 'bad');

    const ops = useOutboxStore.getState().ops;
    expect(pendingCount(ops)).toBe(1);
    expect(errorCount(ops)).toBe(1);
  });
});
