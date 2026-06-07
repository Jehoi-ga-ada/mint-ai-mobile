import {
  formatMoney,
  formatPct,
  formatQuantity,
  gramsToTroyOz,
  parseDecimalInput,
  toNumber,
} from '../src/api/format';

describe('parseDecimalInput', () => {
  it('parses dot decimals', () => {
    expect(parseDecimalInput('0.0042')).toBe(0.0042);
  });
  it('parses comma decimals from locale keyboards', () => {
    expect(parseDecimalInput('0,0042')).toBe(0.0042);
  });
  it('trims whitespace and rejects garbage as NaN', () => {
    expect(parseDecimalInput(' 12.5 ')).toBe(12.5);
    expect(Number.isNaN(parseDecimalInput('abc'))).toBe(true);
    expect(Number.isNaN(parseDecimalInput(''))).toBe(false);
  });
});

describe('toNumber', () => {
  it('passes through numbers', () => {
    expect(toNumber(42)).toBe(42);
  });
  it('parses numeric strings (pydantic Decimal serialized as string)', () => {
    expect(toNumber('1234.56')).toBe(1234.56);
  });
  it('treats null/undefined/garbage as 0', () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber('abc')).toBe(0);
  });
});

describe('formatMoney', () => {
  it('renders IDR with no decimals', () => {
    expect(formatMoney(1000, 'IDR')).toMatch(/1,000/);
    expect(formatMoney(1000, 'IDR')).not.toMatch(/\.00/);
  });
  it('renders USD with two decimals', () => {
    expect(formatMoney(12.5, 'USD')).toMatch(/12\.50/);
  });
});

describe('formatPct', () => {
  it('prefixes positive values with +', () => {
    expect(formatPct(12.345)).toBe('+12.35%');
  });
  it('keeps the minus sign on negatives', () => {
    expect(formatPct(-5)).toBe('-5.00%');
  });
  it('shows a dash for null', () => {
    expect(formatPct(null)).toBe('—');
  });
});

describe('formatQuantity', () => {
  it('trims trailing zeros', () => {
    expect(formatQuantity('0.50000000')).toBe('0.5');
    expect(formatQuantity(2)).toBe('2');
  });
});

describe('gramsToTroyOz', () => {
  it('converts one troy ounce of grams back to ~1', () => {
    expect(gramsToTroyOz(31.1034768)).toBeCloseTo(1, 6);
  });
  it('converts 50g of gold to ~1.6075 ozt', () => {
    expect(gramsToTroyOz(50)).toBeCloseTo(1.607537, 5);
  });
});
