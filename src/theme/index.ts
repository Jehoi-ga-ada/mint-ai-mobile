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
 * pie/donut slices are easy to tell apart on the dark theme.
 * Measured CIEDE2000 floor across every possible slice adjacency (consecutive
 * entries + last-slice-wraps-to-first) and every legend pair: ΔE ≥ 19. */
export const chartPalette = [
  '#3DDC97', // green
  '#4D9DE0', // blue
  '#FFB454', // amber
  '#A78BFA', // violet
  '#F472B6', // pink
  '#22D3EE', // cyan
  '#E11D48', // crimson
  '#9BC53D', // lime
] as const;

export function paletteColor(index: number): string {
  return chartPalette[index % chartPalette.length];
}

/** Semantic palettes so a chart reads as its meaning at a glance: expense is a
 * warm family, income a cool family. Segments take palette colors in order and
 * the last slice closes the ring against the first, so every entry must differ
 * from its neighbors AND from entry 0 — and every pair must differ enough to
 * match legend swatches to slices. Tuned by CIEDE2000 search: consecutive
 * ΔE ≥ 37, wrap-vs-first ΔE ≥ 16, any-pair ΔE ≥ 12 (worst pairs sit in the
 * rarely-reached tail), WCAG ≥ 3:1 vs the card surface. */
export const expensePalette = [
  '#FF6B6B', // red
  '#FFD166', // gold
  '#F472B6', // pink
  '#B45309', // bronze
  '#9D4EDD', // purple
  '#FF8E3C', // orange
  '#A78BFA', // violet
  '#C2453A', // brick
] as const;

export const incomePalette = [
  '#3DDC97', // green
  '#0EA5E9', // azure
  '#16A34A', // forest
  '#06B6D4', // dark cyan
  '#86C232', // olive
  '#67E8F9', // light cyan
  '#BEF264', // pale lime
  '#0D9488', // deep teal
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
