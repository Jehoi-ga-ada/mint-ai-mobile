import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { getErrorMessage } from '../../api/client';
import { formatMoney } from '../../api/format';
import { useMoneyStats } from '../../api/hooks';
import { ChartLegend } from '../../components/charts/ChartLegend';
import { DonutChart } from '../../components/charts/DonutChart';
import { buildSegments } from '../../components/charts/segments';
import { Card } from '../../components/Card';
import { RangeSelector } from '../../components/RangeSelector';
import { Screen } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import { EmptyView, ErrorView, LoadingView } from '../../components/StateView';
import { resolveDefaultRange, useSettingsStore } from '../../store/settingsStore';
import { colors, expensePalette, incomePalette, spacing, typography } from '../../theme';
import type { DateRange, RangePreset } from '../../utils/dateRange';

const IDR = 'IDR';
type TxnType = 'expense' | 'income';

export function MoneyStatsScreen() {
  const defaultRange = useSettingsStore((s) => s.defaultRange);
  const cycleDay = useSettingsStore((s) => s.cycleDay);
  const [type, setType] = useState<TxnType>('expense');
  const [range, setRange] = useState<DateRange>(() =>
    resolveDefaultRange(defaultRange, cycleDay, new Date()),
  );
  const stats = useMoneyStats(type, range);

  useEffect(() => {
    setRange(resolveDefaultRange(defaultRange, cycleDay, new Date()));
  }, [defaultRange, cycleDay]);

  const initial = resolveDefaultRange(defaultRange, cycleDay, new Date());
  const selectorPreset: RangePreset = defaultRange === 'cycle' ? 'custom' : defaultRange;

  return (
    <Screen header scroll refreshing={stats.isRefetching} onRefresh={stats.refetch}>
      <SegmentedControl
        options={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
        value={type}
        onChange={(v) => setType(v as TxnType)}
      />
      <RangeSelector
        key={`${defaultRange}-${cycleDay}`}
        defaultPreset={selectorPreset}
        initialStart={defaultRange === 'cycle' ? initial.start : null}
        initialEnd={defaultRange === 'cycle' ? initial.end : null}
        onChange={setRange}
      />

      {stats.isLoading ? (
        <LoadingView />
      ) : stats.isError || !stats.data ? (
        <ErrorView message={getErrorMessage(stats.error)} onRetry={stats.refetch} />
      ) : (
        <StatsBody type={type} stats={stats.data} />
      )}
    </Screen>
  );
}

interface StatsBodyProps {
  type: TxnType;
  stats: NonNullable<ReturnType<typeof useMoneyStats>['data']>;
}

function StatsBody({ type, stats }: StatsBodyProps) {
  const palette = type === 'income' ? incomePalette : expensePalette;
  const segments = buildSegments(
    stats.by_category.map((c) => ({
      key: c.category_id ?? c.category_name,
      label: c.category_name,
      value: c.total,
    })),
    palette,
  );

  return (
    <Card style={styles.card}>
      {segments.length === 0 ? (
        <EmptyView message="No data for this range." />
      ) : (
        <>
          <DonutChart
            segments={segments}
            centerValue={formatMoney(stats.total, IDR)}
            centerLabel={type === 'income' ? 'Income' : 'Spent'}
          />
          <Text style={styles.caption}>Share of {type} by category</Text>
          <ChartLegend segments={segments} currency={IDR} />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  caption: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
