import { buildSegments, recordToInputs } from '../src/components/charts/segments';

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

describe('recordToInputs', () => {
  it('maps an allocation record to labelled inputs', () => {
    const inputs = recordToInputs({ crypto: 150, metal: 50 }, { crypto: 'Crypto' });
    expect(inputs).toEqual([
      { key: 'crypto', label: 'Crypto', value: 150 },
      { key: 'metal', label: 'metal', value: 50 }, // falls back to the key
    ]);
  });
});
