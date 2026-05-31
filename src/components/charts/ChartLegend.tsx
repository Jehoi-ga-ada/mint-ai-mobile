import { StyleSheet, Text, View } from 'react-native';

import { formatMoney } from '../../api/format';
import { colors, spacing, typography } from '../../theme';
import type { Segment } from './segments';

interface ChartLegendProps {
  segments: Segment[];
  currency: string;
}

export function ChartLegend({ segments, currency }: ChartLegendProps) {
  return (
    <View style={styles.legend}>
      {segments.map((s) => (
        <View key={s.key} style={styles.row}>
          <View style={styles.left}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={styles.label} numberOfLines={1}>
              {s.label}
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.value}>{formatMoney(s.value, currency)}</Text>
            <Text style={styles.pct}>{s.pct.toFixed(1)}%</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { ...typography.body, color: colors.text, flexShrink: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  value: { ...typography.body, color: colors.text },
  pct: { ...typography.caption, color: colors.textMuted, minWidth: 44, textAlign: 'right' },
});
