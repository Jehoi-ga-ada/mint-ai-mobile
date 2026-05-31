import { rangeForCycle, rangeForPreset, toISODate } from '../src/utils/dateRange';

const NOW = new Date(2026, 4, 15); // 15 May 2026 (month index 4)

describe('rangeForCycle', () => {
  it('before the anchor day: last month → this month (25th→25th)', () => {
    const { start, end } = rangeForCycle(25, NOW); // 15 May < 25 May
    expect(toISODate(start)).toBe('2026-04-25');
    expect(toISODate(end)).toBe('2026-05-25');
  });

  it('on/after the anchor day: this month → next month', () => {
    const { start, end } = rangeForCycle(10, NOW); // 15 May ≥ 10 May
    expect(toISODate(start)).toBe('2026-05-10');
    expect(toISODate(end)).toBe('2026-06-10');
  });

  it('clamps the day to a month-safe range', () => {
    expect(toISODate(rangeForCycle(31, NOW).start)).toBe('2026-04-28');
  });
});

describe('rangeForPreset', () => {
  it('month starts on the 1st of the current month', () => {
    const { start, end } = rangeForPreset('month', NOW);
    expect(toISODate(start)).toBe('2026-05-01');
    expect(toISODate(end)).toBe('2026-05-15');
  });

  it('3m goes back three months', () => {
    expect(toISODate(rangeForPreset('3m', NOW).start)).toBe('2026-02-15');
  });

  it('1y goes back twelve months', () => {
    expect(toISODate(rangeForPreset('1y', NOW).start)).toBe('2025-05-15');
  });

  it('all has no bounds', () => {
    expect(rangeForPreset('all', NOW)).toEqual({ start: null, end: null });
  });

  it('custom defers to user-supplied dates (no bounds from preset)', () => {
    expect(rangeForPreset('custom', NOW)).toEqual({ start: null, end: null });
  });
});

describe('toISODate', () => {
  it('formats local date without UTC shift', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
  it('returns undefined for null', () => {
    expect(toISODate(null)).toBeUndefined();
  });
});
