import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DefaultRangeMode } from '../../api/settingsStorage';
import { Card } from '../../components/Card';
import { Picker } from '../../components/Picker';
import { Screen } from '../../components/Screen';
import { useSettingsStore } from '../../store/settingsStore';
import { colors, spacing, typography } from '../../theme';

const OPTIONS: { value: DefaultRangeMode; label: string; hint: string }[] = [
  { value: 'month', label: 'This month', hint: 'Current calendar month (1st →)' },
  { value: 'cycle', label: 'Monthly cycle', hint: 'Custom start day, e.g. 25th → 25th' },
  { value: '3m', label: 'Last 3 months', hint: 'Rolling 90 days' },
  { value: '6m', label: 'Last 6 months', hint: 'Rolling 180 days' },
  { value: '1y', label: 'Last 12 months', hint: 'Rolling year' },
  { value: 'all', label: 'All time', hint: 'Everything' },
];

const CYCLE_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

export function SettingsScreen() {
  const defaultRange = useSettingsStore((s) => s.defaultRange);
  const cycleDay = useSettingsStore((s) => s.cycleDay);
  const setDefaultRange = useSettingsStore((s) => s.setDefaultRange);
  const setCycleDay = useSettingsStore((s) => s.setCycleDay);

  return (
    <Screen header scroll>
      <Text style={styles.sectionTitle}>Default date range</Text>
      <Text style={styles.help}>Transactions and stats open with this range selected.</Text>

      <Card style={styles.card}>
        {OPTIONS.map((opt, i) => {
          const active = opt.value === defaultRange;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setDefaultRange(opt.value)}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
              accessibilityState={{ selected: active }}
              style={[styles.row, i > 0 && styles.divider]}
            >
              <View style={styles.rowText}>
                <Text style={styles.label}>{opt.label}</Text>
                <Text style={styles.hint}>{opt.hint}</Text>
              </View>
              <Text style={[styles.check, active && styles.checkActive]}>
                {active ? '●' : '○'}
              </Text>
            </Pressable>
          );
        })}
      </Card>

      {defaultRange === 'cycle' && (
        <Card>
          <Text style={styles.label}>Cycle start day</Text>
          <Text style={styles.hint}>
            Each period runs from day {cycleDay} of one month to day {cycleDay} of the next.
          </Text>
          <Picker
            label="Start day"
            options={CYCLE_DAYS.map((d) => ({ value: String(d), label: `Day ${d}` }))}
            value={String(cycleDay)}
            onChange={(v) => setCycleDay(Number(v))}
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...typography.heading, color: colors.text },
  help: { ...typography.caption, color: colors.textMuted },
  card: { padding: 0, gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowText: { gap: spacing.xs, flex: 1 },
  label: { ...typography.body, color: colors.text },
  hint: { ...typography.caption, color: colors.textMuted },
  check: { ...typography.heading, color: colors.border },
  checkActive: { color: colors.primary },
});
