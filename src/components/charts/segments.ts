import { toNumber } from '../../api/format';
import type { Numeric } from '../../api/types';
import { chartPalette } from '../../theme';

export interface Segment {
  key: string;
  label: string;
  value: number;
  color: string;
  pct: number;
}

export interface SegmentInput {
  key: string;
  label: string;
  value: Numeric | null | undefined;
}

/** Drop zero/negatives, sort by value desc, assign palette colors and percentages.
 * Pass a semantic palette (e.g. expense/income) so colors read intuitively. */
export function buildSegments(
  entries: SegmentInput[],
  palette: readonly string[] = chartPalette,
): Segment[] {
  const positive = entries
    .map((e) => ({ ...e, value: toNumber(e.value) }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = positive.reduce((sum, e) => sum + e.value, 0);

  return positive.map((e, index) => ({
    key: e.key,
    label: e.label,
    value: e.value,
    color: palette[index % palette.length],
    pct: total > 0 ? (e.value / total) * 100 : 0,
  }));
}

/** Convert an allocation record ({ crypto: 150, ... }) into segment inputs with display labels. */
export function recordToInputs(
  record: Record<string, Numeric>,
  labels: Record<string, string> = {},
): SegmentInput[] {
  return Object.entries(record).map(([key, value]) => ({
    key,
    label: labels[key] ?? key,
    value,
  }));
}
