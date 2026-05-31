import { useLayoutEffect } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../../api/client';
import { formatMoney, formatQuantity } from '../../api/format';
import { usePortfolioTransactions } from '../../api/hooks';
import type { InvestmentTransactionView } from '../../api/types';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { EmptyView, ErrorView, LoadingView } from '../../components/StateView';
import type { PortfolioStackScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

const USD = 'USD';

export function PortfolioTransactionsScreen({
  route,
  navigation,
}: PortfolioStackScreenProps<'PortfolioTransactions'>) {
  const { portfolioId, name } = route.params;
  const txns = usePortfolioTransactions(portfolioId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: `${name} · transactions` });
  }, [navigation, name]);

  if (txns.isLoading) {
    return (
      <Screen header>
        <LoadingView />
      </Screen>
    );
  }
  if (txns.isError) {
    return (
      <Screen header>
        <ErrorView message={getErrorMessage(txns.error)} onRetry={txns.refetch} />
      </Screen>
    );
  }

  return (
    <Screen header>
      <FlatList
        data={txns.data ?? []}
        keyExtractor={(t) => t.id}
        refreshing={txns.isRefetching}
        onRefresh={txns.refetch}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyView message="No investment transactions yet." />}
        renderItem={({ item }) => (
          <Row
            txn={item}
            onPress={() =>
              navigation.navigate('AddInvestment', {
                portfolioId,
                portfolioName: name,
                transaction: item,
              })
            }
          />
        )}
      />
    </Screen>
  );
}

function Row({ txn, onPress }: { txn: InvestmentTransactionView; onPress: () => void }) {
  const isBuy = txn.type === 'buy' || txn.type === 'transfer_in';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${txn.type} ${txn.symbol}`}
    >
      <Card style={styles.row}>
        <View>
          <Text style={styles.title}>
            {txn.type.replace('_', ' ')} {txn.symbol}
          </Text>
          <Text style={styles.meta}>
            {formatQuantity(txn.quantity)} @ {formatMoney(txn.price_per_unit, USD)} ·{' '}
            {new Date(txn.date).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.badge, { color: isBuy ? colors.positive : colors.negative }]}>
          {isBuy ? 'IN' : 'OUT'}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md, paddingVertical: spacing.md, flexGrow: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.body, color: colors.text, textTransform: 'capitalize' },
  meta: { ...typography.caption, color: colors.textMuted },
  badge: { ...typography.caption, fontWeight: '700' },
});
