import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../../api/client';
import { formatPct, toNumber } from '../../api/format';
import { usePortfolios } from '../../api/hooks';
import type { PortfolioView } from '../../api/types';
import { AuthGate } from '../../components/AuthGate';
import { Card } from '../../components/Card';
import { Money } from '../../components/Money';
import { PrivacyToggle } from '../../components/PrivacyToggle';
import { Screen } from '../../components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../components/StateView';
import type { PortfolioStackScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

const USD = 'USD';

export function PortfolioListScreen(props: PortfolioStackScreenProps<'PortfolioList'>) {
  // Gate the whole Portfolio domain at its root. The content (and its server
  // query) only mounts once authed, so guests never fire a doomed request.
  return (
    <AuthGate reason="Portfolios track live USD prices on your account, so they need sign-in.">
      <PortfolioListContent {...props} />
    </AuthGate>
  );
}

function PortfolioListContent({ navigation }: PortfolioStackScreenProps<'PortfolioList'>) {
  const portfolios = usePortfolios();

  const total = (portfolios.data ?? []).reduce(
    (sum, p) => sum + toNumber(p.summary.total_value),
    0,
  );

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Portfolio</Text>
          <Text style={styles.subtitle}>Total invested</Text>
          <Money value={total} currency={USD} sensitive style={styles.total} />
        </View>
        <View style={styles.headerActions}>
          <PrivacyToggle />
          <Pressable
            style={styles.addBtn}
            onPress={() => navigation.navigate('CreatePortfolio')}
            accessibilityRole="button"
            accessibilityLabel="New portfolio"
          >
            <Text style={styles.addText}>+ New</Text>
          </Pressable>
        </View>
      </View>

      {portfolios.isLoading ? (
        <LoadingView />
      ) : portfolios.isError ? (
        <ErrorView message={getErrorMessage(portfolios.error)} onRetry={portfolios.refetch} />
      ) : (
        <FlatList
          data={portfolios.data ?? []}
          keyExtractor={(p) => p.id}
          refreshing={portfolios.isRefetching}
          onRefresh={portfolios.refetch}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyView
              message="No portfolios yet."
              actionLabel="+ New portfolio"
              onAction={() => navigation.navigate('CreatePortfolio')}
            />
          }
          renderItem={({ item }) => (
            <PortfolioRow
              portfolio={item}
              onPress={() =>
                navigation.navigate('PortfolioDetail', {
                  portfolioId: item.id,
                  name: item.name,
                })
              }
            />
          )}
        />
      )}
    </Screen>
  );
}

interface RowProps {
  portfolio: PortfolioView;
  onPress: () => void;
}

function PortfolioRow({ portfolio, onPress }: RowProps) {
  const pl = toNumber(portfolio.summary.unrealized_pl);
  const plColor = pl >= 0 ? colors.positive : colors.negative;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${portfolio.name}`}>
      <Card style={styles.row}>
        <View>
          <Text style={styles.name}>{portfolio.name}</Text>
          <Text style={[styles.pl, { color: plColor }]}>
            {formatPct(portfolio.summary.unrealized_pl_pct)}
          </Text>
        </View>
        <Money value={portfolio.summary.total_value} currency={USD} sensitive style={styles.value} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  total: { ...typography.title, color: colors.text },
  addBtn: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
  },
  addText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  list: { gap: spacing.md, paddingVertical: spacing.md, flexGrow: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { ...typography.heading, color: colors.text },
  pl: { ...typography.caption, marginTop: spacing.xs },
  value: { ...typography.heading, color: colors.text },
});
