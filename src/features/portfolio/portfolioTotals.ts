import { toNumber } from '../../api/format';
import type { PortfolioView } from '../../api/types';

export interface PortfolioTotals {
  totalValue: number;
  totalCost: number;
  totalPl: number;
  /** Growth as a percent of cost; null until something is invested. */
  totalPlPct: number | null;
}

/** Sum value and cost across portfolios and derive overall unrealized P/L. */
export function aggregatePortfolios(portfolios: PortfolioView[]): PortfolioTotals {
  const totalValue = portfolios.reduce((sum, p) => sum + toNumber(p.summary.total_value), 0);
  const totalCost = portfolios.reduce((sum, p) => sum + toNumber(p.summary.total_cost), 0);
  const totalPl = totalValue - totalCost;
  return {
    totalValue,
    totalCost,
    totalPl,
    totalPlPct: totalCost > 0 ? (totalPl / totalCost) * 100 : null,
  };
}
