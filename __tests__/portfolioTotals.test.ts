import { aggregatePortfolios } from '../src/features/portfolio/portfolioTotals';
import type { PortfolioView } from '../src/api/types';

function portfolio(totalValue: number | string, totalCost: number | string): PortfolioView {
  return {
    id: `p-${totalValue}-${totalCost}`,
    name: 'Test',
    base_currency: 'USD',
    summary: {
      total_value: totalValue,
      total_cost: totalCost,
      unrealized_pl: Number(totalValue) - Number(totalCost),
      unrealized_pl_pct: null,
      allocation: {},
    },
  };
}

describe('aggregatePortfolios', () => {
  test('sums value and cost across portfolios and derives total P/L', () => {
    // Arrange
    const portfolios = [portfolio(150, 100), portfolio(50, 60)];

    // Act
    const totals = aggregatePortfolios(portfolios);

    // Assert
    expect(totals.totalValue).toBe(200);
    expect(totals.totalCost).toBe(160);
    expect(totals.totalPl).toBe(40);
    expect(totals.totalPlPct).toBeCloseTo(25); // 40 / 160
  });

  test('returns null growth pct when nothing is invested', () => {
    const totals = aggregatePortfolios([portfolio(0, 0)]);

    expect(totals.totalPl).toBe(0);
    expect(totals.totalPlPct).toBeNull();
  });

  test('handles empty portfolio list', () => {
    const totals = aggregatePortfolios([]);

    expect(totals.totalValue).toBe(0);
    expect(totals.totalCost).toBe(0);
    expect(totals.totalPl).toBe(0);
    expect(totals.totalPlPct).toBeNull();
  });

  test('coerces string numerics from the API', () => {
    const totals = aggregatePortfolios([portfolio('99.5', '100')]);

    expect(totals.totalValue).toBeCloseTo(99.5);
    expect(totals.totalPl).toBeCloseTo(-0.5);
    expect(totals.totalPlPct).toBeCloseTo(-0.5);
  });
});
