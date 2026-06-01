import { toNumber } from '../api/format';
import type { AddTransaction, MoneyStats, MoneySummary, TransactionView } from '../api/types';
import type { DateRange } from '../utils/dateRange';
import { toISODate } from '../utils/dateRange';
import type { OpDisplay, PendingOp } from './outbox';

/** A transaction value used for local delta math, normalized from either a
 * server row (TransactionView) or a queued payload (AddTransaction + display). */
interface TxnEffect {
  date: string;
  type: 'income' | 'expense';
  amount: number;
  accountId: string;
  categoryId: string | null;
  categoryName: string;
}

function fromView(t: TransactionView): TxnEffect {
  return {
    date: t.date,
    type: t.type,
    amount: toNumber(t.amount),
    accountId: t.account_id,
    categoryId: t.category_id,
    categoryName: t.category_name,
  };
}

function fromPayload(p: AddTransaction, display?: OpDisplay): TxnEffect {
  return {
    date: p.date,
    type: p.type,
    amount: toNumber(p.amount),
    accountId: p.account_id,
    categoryId: p.category_id,
    categoryName: display?.categoryName ?? '—',
  };
}

/** Signed contribution to an account balance / total cash (income adds, expense subtracts). */
function balanceDelta(e: TxnEffect): number {
  return e.type === 'income' ? e.amount : -e.amount;
}

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

function pendingView(op: PendingOp): TransactionView {
  const p = op.payload!;
  return {
    id: op.clientId,
    date: p.date,
    type: p.type,
    amount: p.amount,
    currency: p.currency,
    note: p.note,
    category_id: p.category_id,
    category_name: op.display?.categoryName ?? '—',
    account_id: p.account_id,
    account_name: op.display?.accountName ?? '—',
    pending: true,
  };
}

interface TxnFilter {
  type?: 'income' | 'expense';
  range?: DateRange;
}

/** Overlay queued ops onto a server transaction list: hide deleted rows, apply
 * edits, prepend offline creates, then filter to the requested type/range and
 * sort newest-first (matching the server's ordering). */
export function mergeTransactions(
  server: TransactionView[] | undefined,
  ops: PendingOp[],
  filter: TxnFilter = {},
): TransactionView[] {
  const deleted = new Set(
    ops.filter((o) => o.kind === 'delete').map((o) => o.targetId),
  );
  const updates = new Map(
    ops.filter((o) => o.kind === 'update').map((o) => [o.targetId, o]),
  );

  const fromServer = (server ?? [])
    .filter((t) => !deleted.has(t.id))
    .map((t) => {
      const up = updates.get(t.id);
      return up ? { ...pendingView(up), id: t.id } : t;
    });

  const creates = ops
    .filter((o) => o.kind === 'create')
    .map((o) => pendingView(o));

  const matches = (t: TransactionView) =>
    (!filter.type || t.type === filter.type) && inRange(t.date, filter.range);

  return [...creates, ...fromServer]
    .filter(matches)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Each op contributes its effect with direction +1 (apply) or -1 (revert). An
 * update reverts the original and applies the new payload; delete reverts. */
function effectsFor(op: PendingOp): { effect: TxnEffect; dir: 1 | -1 }[] {
  switch (op.kind) {
    case 'create':
      return op.payload ? [{ effect: fromPayload(op.payload, op.display), dir: 1 }] : [];
    case 'delete':
      return op.original ? [{ effect: fromView(op.original), dir: -1 }] : [];
    case 'update': {
      const out: { effect: TxnEffect; dir: 1 | -1 }[] = [];
      if (op.original) {
        out.push({ effect: fromView(op.original), dir: -1 });
      }
      if (op.payload) {
        out.push({ effect: fromPayload(op.payload, op.display), dir: 1 });
      }
      return out;
    }
  }
}

/** Adjust account balances, total cash, and this-month income/expense by the
 * net effect of all queued ops, so MoneyHome reflects offline edits exactly. */
export function applyOpsToSummary(
  server: MoneySummary,
  ops: PendingOp[],
  now: Date = new Date(),
): MoneySummary {
  const balances = new Map(server.accounts.map((a) => [a.id, toNumber(a.balance)]));
  let totalCash = toNumber(server.total_cash);
  let monthIncome = toNumber(server.month_income);
  let monthExpense = toNumber(server.month_expense);

  for (const op of ops) {
    if (op.status === 'error') {
      continue;
    }
    for (const { effect, dir } of effectsFor(op)) {
      const delta = balanceDelta(effect) * dir;
      if (balances.has(effect.accountId)) {
        balances.set(effect.accountId, balances.get(effect.accountId)! + delta);
      }
      totalCash += delta;
      if (inMonth(effect.date, now)) {
        if (effect.type === 'income') {
          monthIncome += effect.amount * dir;
        } else {
          monthExpense += effect.amount * dir;
        }
      }
    }
  }

  return {
    ...server,
    total_cash: totalCash,
    month_income: monthIncome,
    month_expense: monthExpense,
    accounts: server.accounts.map((a) => ({ ...a, balance: balances.get(a.id) ?? a.balance })),
  };
}

/** Adjust the per-category breakdown by the net effect of queued ops that match
 * the stats type and fall within the active date range. */
export function applyOpsToStats(
  server: MoneyStats,
  ops: PendingOp[],
  filter: TxnFilter = {},
): MoneyStats {
  const type = filter.type ?? server.type;
  const totals = new Map<string, { name: string; total: number }>();
  for (const c of server.by_category) {
    const key = c.category_id ?? c.category_name;
    totals.set(key, { name: c.category_name, total: toNumber(c.total) });
  }

  const contribute = (effect: TxnEffect, dir: 1 | -1) => {
    if (effect.type !== type || !inRange(effect.date, filter.range)) {
      return;
    }
    const key = effect.categoryId ?? effect.categoryName;
    const existing = totals.get(key) ?? { name: effect.categoryName, total: 0 };
    totals.set(key, { name: existing.name, total: existing.total + effect.amount * dir });
  };

  for (const op of ops) {
    if (op.status === 'error') {
      continue;
    }
    for (const { effect, dir } of effectsFor(op)) {
      contribute(effect, dir);
    }
  }

  const by_category = Array.from(totals.entries())
    .map(([key, v]) => ({ category_id: key, category_name: v.name, total: v.total }))
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const total = by_category.reduce((sum, c) => sum + c.total, 0);

  return { ...server, total, by_category };
}
