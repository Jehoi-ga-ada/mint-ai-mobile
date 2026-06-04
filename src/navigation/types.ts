import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { InvestmentTransactionView, TransactionView } from '../api/types';

/** Root stack: the tab app is always rendered; auth screens are presented as
 * modals over it (login is optional, only for Portfolio + Assistant). */
export type RootStackParamList = {
  Tabs: undefined;
  Login: undefined;
  Register: undefined;
};

export type MoneyStackParamList = {
  MoneyHome: undefined;
  Transactions: undefined;
  AddTransaction: { transaction?: TransactionView } | undefined;
  MoneyStats: undefined;
  Accounts: undefined;
  Settings: undefined;
};

export type PortfolioStackParamList = {
  PortfolioList: undefined;
  PortfolioDetail: { portfolioId: string; name: string };
  PortfolioTransactions: { portfolioId: string; name: string };
  AddInvestment: {
    portfolioId: string;
    portfolioName: string;
    transaction?: InvestmentTransactionView;
  };
  CreatePortfolio: undefined;
};

export type AppTabParamList = {
  Money: undefined;
  Portfolio: undefined;
  Assistant: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type MoneyStackScreenProps<T extends keyof MoneyStackParamList> =
  NativeStackScreenProps<MoneyStackParamList, T>;

export type PortfolioStackScreenProps<T extends keyof PortfolioStackParamList> =
  NativeStackScreenProps<PortfolioStackParamList, T>;
