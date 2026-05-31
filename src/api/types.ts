/** Shapes returned by the mint-ai backend. Money fields may arrive as a JSON
 * number or a string (pydantic Decimal), so they are typed loosely and coerced
 * at the formatting boundary. */

export type Numeric = number | string;

export type AssetClass = 'crypto' | 'metal' | 'stock' | 'bond' | 'forex' | 'cash';
export type AccountType =
  | 'cash'
  | 'bank'
  | 'ewallet'
  | 'broker'
  | 'crypto_wallet'
  | 'metal_vault';
export type InvTxnType =
  | 'buy'
  | 'sell'
  | 'transfer_in'
  | 'transfer_out'
  | 'dividend'
  | 'interest'
  | 'fee';

export interface Token {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  disabled: boolean;
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  asset_class: AssetClass;
  quote_currency: string;
  price_source: string;
  source_ref: string | null;
  precision: number;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  institution: string | null;
}

export interface HoldingView {
  asset_id: string;
  symbol: string;
  name: string;
  asset_class: AssetClass;
  quantity: Numeric;
  avg_cost: Numeric;
  cost_currency: string | null;
  quote_currency: string;
  current_price: Numeric | null;
  price_available: boolean;
  display_currency: string;
  market_value: Numeric | null;
  cost_basis: Numeric | null;
  unrealized_pl: Numeric | null;
  unrealized_pl_pct: Numeric | null;
  realized_pl: Numeric | null;
}

// -- Portfolio (USD) ---------------------------------------------------------

export interface PortfolioSummary {
  total_value: Numeric;
  total_cost: Numeric;
  unrealized_pl: Numeric;
  unrealized_pl_pct: Numeric | null;
  allocation: Record<string, Numeric>;
}

export interface PortfolioView {
  id: string;
  name: string;
  base_currency: string;
  summary: PortfolioSummary;
}

export interface PortfolioDetail extends PortfolioView {
  holdings: HoldingView[];
}

export interface AssetPrice {
  asset_id: string;
  symbol: string;
  price: Numeric | null;
  currency: string;
  available: boolean;
}

export interface PortfolioHistoryPoint {
  date: string;
  value: Numeric;
}

export interface AddPortfolio {
  name: string;
  base_currency?: string;
}

export interface AddInvestmentTransaction {
  date: string;
  type: InvTxnType;
  quantity: number;
  price_per_unit: number;
  fee: number;
  currency: string;
  portfolio_id: string;
  asset_id: string;
  note: string | null;
}

export interface InvestmentTransactionView {
  id: string;
  date: string;
  type: InvTxnType;
  quantity: Numeric;
  price_per_unit: Numeric;
  fee: Numeric;
  currency: string;
  note: string | null;
  asset_id: string;
  symbol: string;
  portfolio_id: string;
}

// -- Money manager (IDR) -----------------------------------------------------

export type CategoryKind = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
}

export interface AddCategory {
  name: string;
  kind: CategoryKind;
}

export interface TransactionView {
  id: string;
  date: string;
  type: 'income' | 'expense';
  amount: Numeric;
  currency: string;
  note: string | null;
  category_id: string;
  category_name: string;
  account_id: string;
  account_name: string;
}

export interface AccountBalance {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: Numeric;
}

export interface MoneySummary {
  currency: string;
  total_cash: Numeric;
  month_income: Numeric;
  month_expense: Numeric;
  accounts: AccountBalance[];
}

export interface CategoryTotal {
  category_id: string | null;
  category_name: string;
  total: Numeric;
}

export interface MoneyStats {
  type: 'income' | 'expense';
  currency: string;
  total: Numeric;
  by_category: CategoryTotal[];
}

export interface AddTransaction {
  date: string;
  type: 'income' | 'expense';
  amount: number;
  currency: string;
  account_id: string;
  category_id: string;
  note: string | null;
}

export interface AddAccount {
  name: string;
  type: AccountType;
  currency: string;
  institution: string | null;
}
