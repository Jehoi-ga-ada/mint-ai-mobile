import type { Numeric } from './types';

export function toNumber(value: Numeric | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

const DECIMALS: Record<string, number> = { IDR: 0, USD: 2 };

export function formatMoney(value: Numeric | null | undefined, currency: string): string {
  const amount = toNumber(value);
  const fractionDigits = DECIMALS[currency] ?? 2;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(fractionDigits)}`;
  }
}

export function formatQuantity(value: Numeric | null | undefined, precision = 8): string {
  const n = toNumber(value);
  // Trim trailing zeros for readability while respecting the asset's precision.
  return parseFloat(n.toFixed(precision)).toString();
}

export function formatPct(value: Numeric | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  const n = toNumber(value);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

/** Grams to troy ounces — gold/silver are priced per troy ounce (1g ≈ 0.0321507 ozt). */
export const GRAMS_PER_TROY_OUNCE = 31.1034768;

export function gramsToTroyOz(grams: number): number {
  return grams / GRAMS_PER_TROY_OUNCE;
}
