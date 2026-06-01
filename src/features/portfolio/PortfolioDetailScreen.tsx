import { useLayoutEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../../api/client';
import { formatMoney, formatPct, formatQuantity } from '../../api/format';
import { usePortfolio, usePortfolioHistory } from '../../api/hooks';
import type { HoldingView } from '../../api/types';
import { ChartLegend } from '../../components/charts/ChartLegend';
import { DonutChart } from '../../components/charts/DonutChart';
import { LineChart } from '../../components/charts/LineChart';
import { buildSegments, holdingsToInputs } from '../../components/charts/segments';
import { Card } from '../../components/Card';
import { Fab } from '../../components/Fab';
import { Money } from '../../components/Money';
import { PrivacyToggle } from '../../components/PrivacyToggle';
import { RangeSelector } from '../../components/RangeSelector';
import { Screen } from '../../components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../components/StateView';
import type { PortfolioStackScreenProps } from '../../navigation/types';
import { usePrivacyStore } from '../../store/privacyStore';
import { colors, spacing, typography } from '../../theme';
import { type DateRange, rangeForPreset } from '../../utils/dateRange';

const USD = 'USD';

export function PortfolioDetailScreen({
  route,
  navigation,
}: PortfolioStackScreenProps<'PortfolioDetail'>) {
  const { portfolioId, name } = route.params;
  const [range, setRange] = useState<DateRange>(() => rangeForPreset('month', new Date()));
  const hidden = usePrivacyStore((s) => s.hidden);
  const portfolio = usePortfolio(portfolioId);
  const history = usePortfolioHistory(portfolioId, range);

  useLayoutEffect(() => {
    navigation.setOptions({ title: name });
  }, [navigation, name]);

  const goAdd = () =>
    navigation.navigate('AddInvestment', { portfolioId, portfolioName: name });

  if (portfolio.isLoading) {
    return (
      <Screen header>
        <LoadingView />
      </Screen>
    );
  }
  if (portfolio.isError || !portfolio.data) {
    return (
      <Screen header>
        <ErrorView message={getErrorMessage(portfolio.error)} onRetry={portfolio.refetch} />
      </Screen>
    );
  }

  const { summary, holdings } = portfolio.data;
  const plColor = Number(summary.unrealized_pl) >= 0 ? colors.positive : colors.negative;
  const segments = buildSegments(holdingsToInputs(holdings));

  const header = (
    <View style={styles.header}>
      <Card>
        <View style={styles.valueHead}>
          <Text style={styles.label}>Value</Text>
          <PrivacyToggle />
        </View>
        <Money value={summary.total_value} currency={USD} sensitive style={styles.total} />
        <View style={styles.plRow}>
          <Money value={summary.unrealized_pl} currency={USD} signed style={styles.plValue} />
          <Text style={[styles.plPct, { color: plColor }]}>
            {formatPct(summary.unrealized_pl_pct)}
          </Text>
        </View>
        <RangeSelector onChange={setRange} />
        <LineChart values={(history.data ?? []).map((p) => p.value)} color={colors.primary} />
      </Card>

      {segments.length > 0 && (
        <Card style={styles.allocCard}>
          <Text style={styles.sectionTitle}>Allocation</Text>
          <DonutChart
            segments={segments}
            centerValue={hidden ? '••••' : formatMoney(summary.total_value, USD)}
            centerLabel="Value"
          />
          <ChartLegend segments={segments} currency={USD} />
        </Card>
      )}

      <View style={styles.holdingsHead}>
        <Text style={styles.sectionTitle}>Holdings</Text>
        <Pressable
          onPress={() =>
            navigation.navigate('PortfolioTransactions', { portfolioId, name })
          }
          accessibilityRole="button"
          accessibilityLabel="View transactions"
        >
          <Text style={styles.link}>Transactions ›</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Screen header>
      <FlatList
        data={holdings}
        keyExtractor={(h) => h.asset_id}
        refreshing={portfolio.isRefetching}
        onRefresh={portfolio.refetch}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <EmptyView message="No holdings yet." actionLabel="+ Add investment" onAction={goAdd} />
        }
        renderItem={({ item }) => <HoldingRow holding={item} />}
      />
      <Fab label="+ Add" onPress={goAdd} />
    </Screen>
  );
}

function HoldingRow({ holding }: { holding: HoldingView }) {
  const plColor =
    holding.unrealized_pl == null
      ? colors.textMuted
      : Number(holding.unrealized_pl) >= 0
        ? colors.positive
        : colors.negative;
  return (
    <Card style={styles.row}>
      <View>
        <Text style={styles.symbol}>{holding.symbol}</Text>
        <Text style={styles.qty}>
          {formatQuantity(holding.quantity)} {holding.symbol}
        </Text>
      </View>
      <View style={styles.right}>
        {holding.price_available ? (
          <Money value={holding.market_value} currency={USD} style={styles.value} />
        ) : (
          <Text style={styles.unavailable}>price n/a</Text>
        )}
        <Text style={[styles.pl, { color: plColor }]}>
          {formatPct(holding.unrealized_pl_pct)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.lg },
  valueHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { ...typography.heading, color: colors.text },
  holdingsHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  link: { ...typography.caption, color: colors.primary },
  label: { ...typography.caption, color: colors.textMuted },
  total: { ...typography.display, color: colors.text },
  plRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  plValue: { ...typography.heading },
  plPct: { ...typography.heading },
  allocCard: { gap: spacing.lg },
  list: { gap: spacing.md, paddingVertical: spacing.md, paddingBottom: 96, flexGrow: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  symbol: { ...typography.heading, color: colors.text },
  qty: { ...typography.caption, color: colors.textMuted },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  value: { ...typography.heading, color: colors.text },
  unavailable: { ...typography.caption, color: colors.warning },
  pl: { ...typography.caption },
});
