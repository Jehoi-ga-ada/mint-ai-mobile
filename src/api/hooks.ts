import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { importServerMoneyOnce } from '../money/import';
import { useMoneyStore } from '../money/moneyStore';
import { selectLedger, selectStats, selectSummary } from '../money/selectors';
import type { MoneyData } from '../money/types';
import { useAuthStore } from '../store/authStore';
import { toISODate } from '../utils/dateRange';
import type { DateRange } from '../utils/dateRange';
import { api } from './client';
import type {
  Account,
  AccountType,
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
  portfolios: ['portfolios'] as const,
  portfolio: (id: string) => ['portfolio', id] as const,
  portfolioHistory: (id: string, range?: DateRange) =>
    ['portfolio', id, 'history', rangeKey(range)] as const,
  portfolioTransactions: (id: string) => ['portfolio', id, 'transactions'] as const,
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
    onSuccess: async (token, variables) => {
      await signIn(token.access_token, variables.username);
      // Best-effort, one-time pull of any existing server money into the local store.
      importServerMoneyOnce();
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

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (symbol: string): Promise<Asset> =>
      (await api.post<Asset>('/assets', { symbol })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.assets });
    },
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

// -- Local Money reference data (accounts + categories live on-device) --------

const noop = () => {};

/** A read result shaped like react-query's so screens that branch on
 * isLoading/isError/refetch keep working unchanged. Local reads never load,
 * never error, and have nothing to refetch. */
function localResult<T>(data: T) {
  return {
    data,
    isLoading: false,
    isError: false,
    isRefetching: false,
    error: null,
    refetch: noop,
  } as const;
}

/** Local Money state assembled for the pure selectors. Subscribes to the slices
 * that affect derived views so screens re-render on any change. */
function useMoneyData(): MoneyData {
  const accounts = useMoneyStore((s) => s.accounts);
  const categories = useMoneyStore((s) => s.categories);
  const transactions = useMoneyStore((s) => s.transactions);
  return useMemo(
    () => ({ accounts, categories, transactions, schemaVersion: 1, seeded: true, imported: false }),
    [accounts, categories, transactions],
  );
}

export function useAccounts() {
  const accounts = useMoneyStore((s) => s.accounts);
  return localResult<Account[]>(accounts);
}

export function useCategories(kind?: CategoryKind) {
  const all = useMoneyStore((s) => s.categories);
  const data = useMemo(() => (kind ? all.filter((c) => c.kind === kind) : all), [all, kind]);
  return localResult<Category[]>(data);
}

export function useCreateCategory() {
  return useMutation({
    mutationFn: async (payload: AddCategory): Promise<Category> =>
      useMoneyStore.getState().addCategory(payload),
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

// -- Money manager (IDR) — fully local, derived from the on-device store ------

export function useMoneySummary() {
  const data = useMoneyData();
  const summary = useMemo<MoneySummary>(() => selectSummary(data), [data]);
  return localResult<MoneySummary>(summary);
}

export function useMoneyStats(type: 'income' | 'expense', range?: DateRange) {
  const data = useMoneyData();
  const stats = useMemo<MoneyStats>(() => selectStats(data, type, range), [data, type, range]);
  return localResult<MoneyStats>(stats);
}

export function useTransactions(type?: 'income' | 'expense', range?: DateRange) {
  const data = useMoneyData();
  const ledger = useMemo<TransactionView[]>(
    () => selectLedger(data, type, range),
    [data, type, range],
  );
  return localResult<TransactionView[]>(ledger);
}

/** Money writes commit synchronously to the local store and resolve at once.
 * `useMutation` is kept so callers keep their mutate/mutateAsync/isPending/
 * onSuccess surface; the store re-renders subscribers, so no invalidation. */
export function useCreateTransaction() {
  return useMutation({
    mutationFn: async (payload: AddTransaction) =>
      useMoneyStore.getState().addTransaction(payload),
  });
}

export function useUpdateTransaction() {
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: AddTransaction;
      original?: TransactionView;
    }) => {
      useMoneyStore.getState().updateTransaction(id, payload);
      return { id };
    },
  });
}

export function useDeleteTransaction() {
  return useMutation({
    mutationFn: async ({ id }: { id: string; original?: TransactionView }) => {
      useMoneyStore.getState().deleteTransaction(id);
      return { id };
    },
  });
}

export function useCreateAccount() {
  return useMutation({
    mutationFn: async (payload: AddAccount) => useMoneyStore.getState().addAccount(payload),
  });
}

export function useUpdateAccount() {
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; name: string; type: AccountType }) => {
      useMoneyStore.getState().updateAccount(id, patch);
      return { id };
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (id: string) => {
      useMoneyStore.getState().deleteAccount(id);
      return { id };
    },
  });
}

/** Permanently delete the signed-in user's server account (Apple requires this
 * in-app). Local Money data is the user's own and is left on the device. */
export function useDeleteMyAccount() {
  return useMutation({
    mutationFn: async () => {
      await api.delete('/auth/me');
    },
  });
}
