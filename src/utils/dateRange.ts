export type RangePreset = 'month' | '3m' | '6m' | '1y' | 'all' | 'custom';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'month', label: 'Month' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'All' },
  { value: 'custom', label: 'Custom' },
];

function monthsAgo(now: Date, months: number): Date {
  const d = new Date(now);
  d.setMonth(d.getMonth() - months);
  return d;
}

/** Resolve a preset to a concrete [start, end] window (custom/all return nulls). */
export function rangeForPreset(preset: RangePreset, now: Date): DateRange {
  switch (preset) {
    case 'month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case '3m':
      return { start: monthsAgo(now, 3), end: now };
    case '6m':
      return { start: monthsAgo(now, 6), end: now };
    case '1y':
      return { start: monthsAgo(now, 12), end: now };
    case 'all':
    case 'custom':
    default:
      return { start: null, end: null };
  }
}

/** Monthly billing-style cycle anchored on `day` (e.g. 25 → 25th→25th).
 * Returns the cycle window containing `now`: [latest anchor ≤ now, next anchor). */
export function rangeForCycle(day: number, now: Date): DateRange {
  const d = Math.min(Math.max(Math.round(day), 1), 28); // predictable across all months
  const y = now.getFullYear();
  const m = now.getMonth();
  const thisAnchor = new Date(y, m, d);
  if (now >= thisAnchor) {
    return { start: thisAnchor, end: new Date(y, m + 1, d) };
  }
  return { start: new Date(y, m - 1, d), end: thisAnchor };
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Local YYYY-MM-DD (avoids the UTC off-by-one from toISOString). */
export function toISODate(d: Date | null): string | undefined {
  if (!d) {
    return undefined;
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
