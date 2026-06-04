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

/** High-contrast categorical palette — hues spread around the wheel so adjacent
 * pie/donut slices are easy to tell apart on the dark theme. */
export const chartPalette = [
  '#3DDC97', // green
  '#4D9DE0', // blue
  '#FFB454', // amber
  '#A78BFA', // violet
  '#F472B6', // pink
  '#22D3EE', // cyan
  '#FB7185', // rose
  '#9BC53D', // lime
] as const;

export function paletteColor(index: number): string {
  return chartPalette[index % chartPalette.length];
}

/** Semantic palettes so a chart reads as its meaning at a glance: expense is a
 * warm red→orange family, income a green→teal family. Hues still vary enough to
 * tell adjacent slices apart, but the overall tone signals expense vs income. */
export const expensePalette = [
  '#FF6B6B', // red
  '#FB7185', // rose
  '#FF8E72', // coral
  '#FFA94D', // orange
  '#F4708E', // pink-red
  '#FFB454', // amber
  '#E2574D', // brick
  '#D65DB1', // magenta
] as const;

export const incomePalette = [
  '#3DDC97', // green
  '#2BA876', // deep green
  '#34D399', // emerald
  '#22D3EE', // cyan
  '#5EC8B0', // teal
  '#9BC53D', // lime
  '#4DD0A0', // mint
  '#86C232', // olive-green
] as const;

export function paletteForType(type: 'income' | 'expense'): readonly string[] {
  return type === 'income' ? incomePalette : expensePalette;
}

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  chartPalette,
  expensePalette,
  incomePalette,
};
export type Theme = typeof theme;
