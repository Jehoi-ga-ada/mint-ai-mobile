import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMoney } from '../../api/format';
import { colors, radius, spacing, typography } from '../../theme';
import type { Segment } from './segments';

interface ChartLegendProps {
  segments: Segment[];
  currency: string;
  /** Controlled selection shared with the donut (useSliceSelection). When
   * provided, rows are tappable and the selected one is highlighted — the row
   * shows the slice's full name and value, so the chart itself never has to
   * squeeze long labels. */
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
}

export function ChartLegend({ segments, currency, selectedKey, onSelect }: ChartLegendProps) {
  return (
    <View style={styles.legend}>
      {segments.map((s) => {
        const isSelected = selectedKey === s.key;
        const isDimmed = selectedKey != null && !isSelected;
        const row = (
          <View
            style={[styles.row, isSelected && styles.rowSelected, isDimmed && styles.rowDimmed]}
          >
            <View style={styles.left}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              {/* The selected row may wrap so the full name is always readable. */}
              <Text style={styles.label} numberOfLines={isSelected ? undefined : 1}>
                {s.label}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.value}>{formatMoney(s.value, currency)}</Text>
              <Text style={styles.pct}>{s.pct.toFixed(1)}%</Text>
            </View>
          </View>
        );
        return onSelect ? (
          <Pressable
            key={s.key}
            onPress={() => onSelect(s.key)}
            accessibilityRole="button"
            accessibilityLabel={`${s.label}, ${s.pct.toFixed(1)} percent`}
            accessibilityState={{ selected: isSelected }}
          >
            {row}
          </Pressable>
        ) : (
          <View key={s.key}>{row}</View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
    borderRadius: radius.md,
  },
  rowSelected: { backgroundColor: colors.surfaceAlt },
  rowDimmed: { opacity: 0.45 },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { ...typography.body, color: colors.text, flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  value: { ...typography.body, color: colors.text },
  pct: { ...typography.caption, color: colors.textMuted, minWidth: 44, textAlign: 'right' },
});
