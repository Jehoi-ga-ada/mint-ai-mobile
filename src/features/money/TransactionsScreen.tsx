import { useEffect, useState } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../../api/client';
import { formatMoney } from '../../api/format';
import { useTransactions } from '../../api/hooks';
import type { TransactionView } from '../../api/types';
import { Card } from '../../components/Card';
import { Money } from '../../components/Money';
import { RangeSelector } from '../../components/RangeSelector';
import { Screen } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import { EmptyView, ErrorView, LoadingView } from '../../components/StateView';
import type { MoneyStackScreenProps } from '../../navigation/types';
import { resolveDefaultRange, useSettingsStore } from '../../store/settingsStore';
import { colors, spacing, typography } from '../../theme';
import type { DateRange, RangePreset } from '../../utils/dateRange';
import { groupTransactionsByDay } from '../../utils/groupTransactions';

const IDR = 'IDR';
type Filter = 'all' | 'expense' | 'income';

export function TransactionsScreen({ navigation }: MoneyStackScreenProps<'Transactions'>) {
  const defaultRange = useSettingsStore((s) => s.defaultRange);
  const cycleDay = useSettingsStore((s) => s.cycleDay);
  const [filter, setFilter] = useState<Filter>('all');
  const [range, setRange] = useState<DateRange>(() =>
    resolveDefaultRange(defaultRange, cycleDay, new Date()),
  );
  const txns = useTransactions(filter === 'all' ? undefined : filter, range);

  // Re-apply when the persisted default loads/changes.
  useEffect(() => {
    setRange(resolveDefaultRange(defaultRange, cycleDay, new Date()));
  }, [defaultRange, cycleDay]);

  const initial = resolveDefaultRange(defaultRange, cycleDay, new Date());
  const selectorPreset: RangePreset = defaultRange === 'cycle' ? 'custom' : defaultRange;
  const sections = groupTransactionsByDay(txns.data ?? [], new Date());

  return (
    <Screen header>
      <SegmentedControl
        options={[
          { value: 'all', label: 'All' },
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ]}
        value={filter}
        onChange={(v) => setFilter(v as Filter)}
      />
      <RangeSelector
        key={`${defaultRange}-${cycleDay}`}
        defaultPreset={selectorPreset}
        initialStart={defaultRange === 'cycle' ? initial.start : null}
        initialEnd={defaultRange === 'cycle' ? initial.end : null}
        onChange={setRange}
      />

      {txns.isLoading ? (
        <LoadingView />
      ) : txns.isError ? (
        <ErrorView message={getErrorMessage(txns.error)} onRetry={txns.refetch} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(t) => t.id}
          stickySectionHeadersEnabled
          refreshing={txns.isRefetching}
          onRefresh={txns.refetch}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyView message="No transactions in this range." />}
          renderSectionHeader={({ section }) => (
            <DayHeader label={section.label} expense={section.expense} income={section.income} />
          )}
          renderItem={({ item }) => (
            <Row
              txn={item}
              onPress={() => navigation.navigate('AddTransaction', { transaction: item })}
            />
          )}
        />
      )}
    </Screen>
  );
}

function DayHeader({
  label,
  expense,
  income,
}: {
  label: string;
  expense: number;
  income: number;
}) {
  return (
    <View style={styles.dayHeader}>
      <Text style={styles.dayLabel}>{label}</Text>
      <View style={styles.dayTotals}>
        {expense > 0 && <Text style={styles.dayExpense}>−{formatMoney(expense, IDR)}</Text>}
        {income > 0 && <Text style={styles.dayIncome}>+{formatMoney(income, IDR)}</Text>}
      </View>
    </View>
  );
}

function Row({ txn, onPress }: { txn: TransactionView; onPress: () => void }) {
  const isIncome = txn.type === 'income';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Edit ${txn.category_name}, ${txn.account_name}`}
    >
      <Card style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.category}>{txn.category_name}</Text>
          <Text style={styles.meta}>{txn.account_name}</Text>
          {!!txn.note && <Text style={styles.note}>{txn.note}</Text>}
        </View>
        <Text style={[styles.amount, { color: isIncome ? colors.positive : colors.negative }]}>
          {isIncome ? '+' : '−'}
          <Money value={txn.amount} currency={IDR} />
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: spacing.md, flexGrow: 1 },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
  },
  dayLabel: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
  dayTotals: { flexDirection: 'row', gap: spacing.md },
  dayExpense: { ...typography.caption, color: colors.negative },
  dayIncome: { ...typography.caption, color: colors.positive },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  left: { gap: spacing.xs, flex: 1 },
  category: { ...typography.body, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted },
  note: { ...typography.caption, color: colors.textMuted, fontStyle: 'italic' },
  amount: { ...typography.heading, marginLeft: spacing.md },
});
