import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../../api/client';
import { useMoneySummary } from '../../api/hooks';
import { Card } from '../../components/Card';
import { Fab } from '../../components/Fab';
import { Icon } from '../../components/Icon';
import { Money } from '../../components/Money';
import { PrivacyToggle } from '../../components/PrivacyToggle';
import { Screen } from '../../components/Screen';
import { ErrorView, LoadingView, OfflineView } from '../../components/StateView';
import type { MoneyStackScreenProps } from '../../navigation/types';
import { useNetworkStore } from '../../store/networkStore';
import { colors, radius, spacing, typography } from '../../theme';

const IDR = 'IDR';

export function MoneyHomeScreen({ navigation }: MoneyStackScreenProps<'MoneyHome'>) {
  const summary = useMoneySummary();
  const isOnline = useNetworkStore((s) => s.isOnline);

  // No cached data to show: distinguish a real error, being offline, and loading.
  if (!summary.data) {
    return (
      <Screen>
        {summary.isError ? (
          <ErrorView message={getErrorMessage(summary.error)} onRetry={summary.refetch} />
        ) : !isOnline ? (
          <OfflineView onRetry={summary.refetch} />
        ) : (
          <LoadingView />
        )}
      </Screen>
    );
  }

  const data = summary.data;

  return (
    <Screen
      scroll
      refreshing={summary.isRefetching}
      onRefresh={summary.refetch}
      fab={<Fab label="+ Transaction" onPress={() => navigation.navigate('AddTransaction')} />}
    >
      <View style={styles.topRow}>
        <Text style={styles.title}>Money</Text>
        <View style={styles.topActions}>
          <PrivacyToggle />
          <Pressable
            onPress={() => navigation.navigate('Settings')}
            hitSlop={8}
            style={styles.gear}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Icon name="settings" color={colors.text} size={20} />
          </Pressable>
        </View>
      </View>

      <Card>
        <Text style={styles.label}>Total cash</Text>
        <Money value={data.total_cash} currency={IDR} sensitive style={styles.total} />
        <View style={styles.splitRow}>
          <View style={styles.split}>
            <Text style={styles.label}>Income (this month)</Text>
            <Money value={data.month_income} currency={IDR} sensitive style={styles.income} />
          </View>
          <View style={styles.split}>
            <Text style={styles.label}>Expense (this month)</Text>
            <Money value={data.month_expense} currency={IDR} sensitive style={styles.expense} />
          </View>
        </View>
      </Card>

      <View style={styles.actions}>
        <Action label="Stats" onPress={() => navigation.navigate('MoneyStats')} />
        <Action label="History" onPress={() => navigation.navigate('Transactions')} />
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Accounts</Text>
        <Pressable
          onPress={() => navigation.navigate('Accounts')}
          accessibilityRole="button"
          accessibilityLabel="Manage accounts"
        >
          <Text style={styles.manage}>Manage</Text>
        </Pressable>
      </View>
      {data.accounts.map((a) => (
        <Card key={a.id} style={styles.accountRow}>
          <View>
            <Text style={styles.accountName}>{a.name}</Text>
            <Text style={styles.accountMeta}>{a.type.replace('_', ' ')}</Text>
          </View>
          <Money value={a.balance} currency={IDR} sensitive style={styles.accountBalance} />
        </Card>
      ))}
    </Screen>
  );
}

interface ActionProps {
  label: string;
  onPress: () => void;
  primary?: boolean;
}

function Action({ label, onPress, primary }: ActionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.action, primary && styles.actionPrimary]}
    >
      <Text style={[styles.actionText, primary && styles.actionTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  gear: {
    // HIG: 44×44pt minimum tap target.
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // iOS large-title style for the top-level screen heading.
  title: { ...typography.display, color: colors.text },
  label: { ...typography.caption, color: colors.textMuted },
  total: { ...typography.display, color: colors.text },
  splitRow: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm },
  split: { flex: 1, gap: spacing.xs },
  income: { ...typography.heading, color: colors.positive },
  expense: { ...typography.heading, color: colors.negative },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.md,
    minHeight: 44, // HIG tap target
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: { backgroundColor: colors.primary },
  actionText: { ...typography.caption, color: colors.text, fontWeight: '600' },
  actionTextPrimary: { color: colors.background },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { ...typography.heading, color: colors.text },
  manage: { ...typography.caption, color: colors.primary },
  accountRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  accountName: { ...typography.body, color: colors.text },
  accountMeta: { ...typography.caption, color: colors.textMuted, textTransform: 'capitalize' },
  accountBalance: { ...typography.heading, color: colors.text },
});
