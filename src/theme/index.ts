/** Design tokens. Single light theme for Phase 1; dark support can layer on later. */

export const colors = {
  background: '#0B0F14',
  surface: '#151B23',
  surfaceAlt: '#1E2630',
  border: '#2A333F',
  primary: '#3DDC97',
  primaryDim: '#2BA876',
  text: '#F5F7FA',
  textMuted: '#9AA7B4',
  positive: '#3DDC97',
  negative: '#FF6B6B',
  warning: '#FFB454',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '700' as const },
  title: { fontSize: 22, fontWeight: '700' as const },
  heading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
} as const;

/** Neutral categorical palette — for value-neutral breakdowns (e.g. portfolio
 * allocation by asset class), where no slice is "good" or "bad". */
export const chartPalette = [
  '#4D9DE0',
  '#E1BC29',
  '#7768AE',
  '#5BC0BE',
  '#F4A259',
  '#C45BAA',
  '#3DA5D9',
  '#9BC53D',
] as const;

/** Money OUT — warm reds/oranges (intuitively "spending"). */
export const expensePalette = [
  '#FF6B6B',
  '#FF8C42',
  '#F4A259',
  '#E15554',
  '#FFB454',
  '#C45B6B',
  '#D7263D',
  '#FF9F1C',
] as const;

/** Money IN — greens/teals (intuitively "earning"). */
export const incomePalette = [
  '#3DDC97',
  '#2BB673',
  '#5BC0BE',
  '#6FCF97',
  '#26A69A',
  '#1B9C85',
  '#8BD450',
  '#00B8A9',
] as const;

export function paletteColor(index: number): string {
  return chartPalette[index % chartPalette.length];
}

export const theme = { colors, spacing, radius, typography, chartPalette };
export type Theme = typeof theme;
