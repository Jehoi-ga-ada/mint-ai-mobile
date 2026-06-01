import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';

import { applyOpsToStats, applyOpsToSummary, mergeTransactions } from '../offline/merge';
import { type OpDisplay, useOutboxStore } from '../offline/outbox';
import { flushOutbox } from '../offline/sync';
import { useAuthStore } from '../store/authStore';
import { toISODate } from '../utils/dateRange';
import type { DateRange } from '../utils/dateRange';
import { api } from './client';
import type {
  Account,
  AccountBalance,
  AddAccount,
  AddInvestmentTransaction,
  AddPortfolio,
  AddTransaction,
  AddCategory,
  Asset,
  AssetPrice,
  Category,
  CategoryKind,
  InvestmentTransactionView,
  MoneyStats,
  MoneySummary,
  PortfolioDetail,
  PortfolioHistoryPoint,
  PortfolioView,
  Token,
  TransactionView,
  User,
} from './types';

function rangeParams(range?: DateRange): Record<string, string> {
  const params: Record<string, string> = {};
  const start = toISODate(range?.start ?? null);
  const end = toISODate(range?.end ?? null);
  if (start) {
    params.start = start;
  }
  if (end) {
    params.end = end;
  }
  return params;
}

function rangeKey(range?: DateRange): string {
  return `${toISODate(range?.start ?? null) ?? ''}_${toISODate(range?.end ?? null) ?? ''}`;
}

export const queryKeys = {
  assets: ['assets'] as const,
  assetPrice: (id: string) => ['assetPrice', id] as const,
  accounts: ['accounts'] as const,
  categories: (kind?: string) => ['categories', kind ?? 'all'] as const,
  portfolios: ['portfolios'] as const,
  portfolio: (id: string) => ['portfolio', id] as const,
  portfolioHistory: (id: string, range?: DateRange) =>
    ['portfolio', id, 'history', rangeKey(range)] as const,
  portfolioTransactions: (id: string) => ['portfolio', id, 'transactions'] as const,
  moneySummary: ['money', 'summary'] as const,
  moneyStats: (type: string, range?: DateRange) =>
    ['money', 'stats', type, rangeKey(range)] as const,
  transactions: (type?: string, range?: DateRange) =>
    ['money', 'transactions', type ?? 'all', rangeKey(range)] as const,
};

// -- Auth --------------------------------------------------------------------

interface LoginInput {
  username: string;
  password: string;
}

export function useLogin() {
  const signIn = useAuthStore((s) => s.signIn);
  return useMutation({
    mutationFn: async ({ username, password }: LoginInput): Promise<Token> => {
      const body = new URLSearchParams();
      body.append('username', username);
      body.append('password', password);
      const { data } = await api.post<Token>('/auth/login', body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return data;
    },
    onSuccess: async (token) => {
      await signIn(token.access_token);
    },
  });
}

interface RegisterInput {
  username: string;
  email: string;
  password: string;
}

export function useRegister() {
  return useMutation({
    mutationFn: async (input: RegisterInput): Promise<User> => {
      const { data } = await api.post<User>('/auth/register', input);
      return data;
    },
  });
}

// -- Reference data ----------------------------------------------------------

export function useAssets() {
  return useQuery({
    queryKey: queryKeys.assets,
    queryFn: async (): Promise<Asset[]> => (await api.get<Asset[]>('/assets')).data,
  });
}

export function useAssetPrice(assetId: string | null) {
  return useQuery({
    queryKey: queryKeys.assetPrice(assetId ?? ''),
    enabled: !!assetId,
    queryFn: async (): Promise<AssetPrice> =>
      (await api.get<AssetPrice>(`/assets/${assetId}/price`)).data,
  });
}

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async (): Promise<Account[]> => (await api.get<Account[]>('/accounts')).data,
  });
}

export function useCategories(kind?: CategoryKind) {
  return useQuery({
    queryKey: queryKeys.categories(kind),
    queryFn: async (): Promise<Category[]> =>
      (await api.get<Category[]>('/categories', { params: kind ? { kind } : {} })).data,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddCategory): Promise<Category> =>
      (await api.post<Category>('/categories', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  });
}

// -- Portfolio (USD) ---------------------------------------------------------

export function usePortfolios() {
  return useQuery({
    queryKey: queryKeys.portfolios,
    queryFn: async (): Promise<PortfolioView[]> =>
      (await api.get<PortfolioView[]>('/portfolios')).data,
  });
}

export function usePortfolio(portfolioId: string) {
  return useQuery({
    queryKey: queryKeys.portfolio(portfolioId),
    queryFn: async (): Promise<PortfolioDetail> =>
      (await api.get<PortfolioDetail>(`/portfolios/${portfolioId}`)).data,
  });
}

export function usePortfolioHistory(portfolioId: string, range?: DateRange) {
  return useQuery({
    queryKey: queryKeys.portfolioHistory(portfolioId, range),
    queryFn: async (): Promise<PortfolioHistoryPoint[]> =>
      (
        await api.get<PortfolioHistoryPoint[]>(`/portfolios/${portfolioId}/history`, {
          params: rangeParams(range),
        })
      ).data,
  });
}

export function usePortfolioTransactions(portfolioId: string) {
  return useQuery({
    queryKey: queryKeys.portfolioTransactions(portfolioId),
    queryFn: async (): Promise<InvestmentTransactionView[]> =>
      (await api.get<InvestmentTransactionView[]>(`/portfolios/${portfolioId}/transactions`)).data,
  });
}

export function useCreatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddPortfolio) =>
      (await api.post<PortfolioView>('/portfolios', payload)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.portfolios }),
  });
}

function invalidatePortfolio(qc: ReturnType<typeof useQueryClient>, portfolioId: string) {
  qc.invalidateQueries({ queryKey: queryKeys.portfolios });
  qc.invalidateQueries({ queryKey: ['portfolio', portfolioId] });
}

export function useCreateInvestmentTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddInvestmentTransaction) =>
      (await api.post('/investment/transaction', payload)).data,
    onSuccess: (_data, variables) => invalidatePortfolio(qc, variables.portfolio_id),
  });
}

export function useUpdateInvestmentTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: AddInvestmentTransaction }) =>
      (await api.put(`/investment/transaction/${id}`, payload)).data,
    onSuccess: (_data, variables) => invalidatePortfolio(qc, variables.payload.portfolio_id),
  });
}

export function useDeleteInvestmentTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; portfolioId: string }) =>
      (await api.delete(`/investment/transaction/${id}`)).data,
    onSuccess: (_data, variables) => invalidatePortfolio(qc, variables.portfolioId),
  });
}

// -- Money manager (IDR) -----------------------------------------------------

export function useMoneySummary() {
  const query = useQuery({
    queryKey: queryKeys.moneySummary,
    queryFn: async (): Promise<MoneySummary> =>
      (await api.get<MoneySummary>('/money/summary')).data,
  });
  const ops = useOutboxStore((s) => s.ops);
  const data = useMemo(
    () => (query.data ? applyOpsToSummary(query.data, ops) : query.data),
    [query.data, ops],
  );
  return { ...query, data };
}

export function useMoneyStats(type: 'income' | 'expense', range?: DateRange) {
  const query = useQuery({
    queryKey: queryKeys.moneyStats(type, range),
    queryFn: async (): Promise<MoneyStats> =>
      (await api.get<MoneyStats>('/money/stats', { params: { type, ...rangeParams(range) } })).data,
  });
  const ops = useOutboxStore((s) => s.ops);
  const data = useMemo(
    () => (query.data ? applyOpsToStats(query.data, ops, { type, range }) : query.data),
    [query.data, ops, type, range],
  );
  return { ...query, data };
}

export function useTransactions(type?: 'income' | 'expense', range?: DateRange) {
  const query = useQuery({
    queryKey: queryKeys.transactions(type, range),
    queryFn: async (): Promise<TransactionView[]> =>
      (
        await api.get<TransactionView[]>('/money/transactions', {
          params: { type, ...rangeParams(range) },
        })
      ).data,
  });
  const ops = useOutboxStore((s) => s.ops);
  // Overlay queued ops so offline creates/edits/deletes show immediately. Even
  // with no server data yet (cold offline), pending creates still render.
  const data = useMemo(
    () => mergeTransactions(query.data, ops, { type, range }),
    [query.data, ops, type, range],
  );
  return { ...query, data };
}

/** Resolve display names from the cached reference data so a queued transaction
 * can render in the ledger without a network round-trip (works fully offline). */
function resolveNames(qc: QueryClient, payload: AddTransaction): OpDisplay {
  const accounts = qc.getQueryData<Account[]>(queryKeys.accounts) ?? [];
  const accountName = accounts.find((a) => a.id === payload.account_id)?.name ?? '—';
  const categories =
    qc.getQueryData<Category[]>(queryKeys.categories(payload.type)) ??
    qc.getQueryData<Category[]>(queryKeys.categories(undefined)) ??
    [];
  const categoryName = categories.find((c) => c.id === payload.category_id)?.name ?? '—';
  return { categoryName, accountName };
}

/** Money writes are offline-first: they enqueue to the local outbox (so the UI
 * updates instantly via the overlay) and the sync engine replays them to the
 * backend when reachable. They resolve as soon as the change is queued. */
export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddTransaction) => {
      const clientId = useOutboxStore
        .getState()
        .enqueueCreate(payload, resolveNames(qc, payload));
      flushOutbox(qc);
      return { clientId };
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
      original,
    }: {
      id: string;
      payload: AddTransaction;
      original?: TransactionView;
    }) => {
      useOutboxStore.getState().enqueueUpdate(id, payload, resolveNames(qc, payload), original);
      flushOutbox(qc);
      return { id };
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, original }: { id: string; original?: TransactionView }) => {
      useOutboxStore.getState().enqueueDelete(id, original);
      flushOutbox(qc);
      return { id };
    },
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddAccount) =>
      (await api.post<AccountBalance>('/accounts', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: queryKeys.moneySummary });
    },
  });
}
