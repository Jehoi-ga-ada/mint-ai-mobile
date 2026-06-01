import { buildSegments, holdingsToInputs } from '../src/components/charts/segments';
import type { HoldingView } from '../src/api/types';

function holding(overrides: Partial<HoldingView>): HoldingView {
  return {
    asset_id: 'a1',
    symbol: 'BTC',
    name: 'Bitcoin',
    asset_class: 'crypto',
    quantity: '1',
    avg_cost: '0',
    cost_currency: 'USD',
    quote_currency: 'USD',
    current_price: '100',
    price_available: true,
    display_currency: 'USD',
    market_value: '100',
    cost_basis: '0',
    unrealized_pl: '0',
    unrealized_pl_pct: '0',
    realized_pl: '0',
    ...overrides,
  };
}

describe('buildSegments', () => {
  it('drops zero/negative, sorts by value desc, computes percentages', () => {
    const segments = buildSegments([
      { key: 'a', label: 'A', value: 30 },
      { key: 'b', label: 'B', value: 0 },
      { key: 'c', label: 'C', value: 70 },
    ]);

    expect(segments.map((s) => s.key)).toEqual(['c', 'a']);
    expect(segments[0].pct).toBeCloseTo(70);
    expect(segments[1].pct).toBeCloseTo(30);
  });

  it('assigns distinct palette colors per segment', () => {
    const segments = buildSegments([
      { key: 'a', label: 'A', value: 10 },
      { key: 'b', label: 'B', value: 5 },
    ]);

    expect(segments[0].color).not.toBe(segments[1].color);
  });

  it('parses string (Decimal) values', () => {
    const segments = buildSegments([{ key: 'a', label: 'A', value: '12.5' }]);
    expect(segments[0].value).toBe(12.5);
    expect(segments[0].pct).toBeCloseTo(100);
  });

  it('returns empty for no positive values', () => {
    expect(buildSegments([{ key: 'a', label: 'A', value: 0 }])).toEqual([]);
  });
});

describe('holdingsToInputs', () => {
  it('maps each holding to a per-asset input keyed by asset with the symbol as label', () => {
    const inputs = holdingsToInputs([
      holding({ asset_id: 'a1', symbol: 'BTC', market_value: '150' }),
      holding({ asset_id: 'a2', symbol: 'ETH', market_value: '50' }),
    ]);

    expect(inputs).toEqual([
      { key: 'a1', label: 'BTC', value: '150' },
      { key: 'a2', label: 'ETH', value: '50' },
    ]);
  });

  it('skips holdings without a live price', () => {
    const inputs = holdingsToInputs([
      holding({ asset_id: 'a1', symbol: 'BTC', market_value: '150' }),
      holding({ asset_id: 'a2', symbol: 'XAU', price_available: false, market_value: null }),
    ]);

    expect(inputs).toHaveLength(1);
    expect(inputs[0].key).toBe('a1');
  });

  it('drives a per-asset (not per-class) allocation through buildSegments', () => {
    const segments = buildSegments(
      holdingsToInputs([
        holding({ asset_id: 'a1', symbol: 'BTC', market_value: '75' }),
        holding({ asset_id: 'a2', symbol: 'ETH', market_value: '25' }),
      ]),
    );

    expect(segments.map((s) => s.label)).toEqual(['BTC', 'ETH']);
    expect(segments[0].pct).toBeCloseTo(75);
  });
});
