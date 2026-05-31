import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../../api/client';
import { useAccounts, useCreateAccount } from '../../api/hooks';
import type { AccountType } from '../../api/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import { ErrorView, LoadingView } from '../../components/StateView';
import { colors, radius, typography } from '../../theme';

// Money-manager accounts only (IDR). Investment custody lives under Portfolios.
const ACCOUNT_TYPES: AccountType[] = ['bank', 'cash', 'ewallet'];
const IDR = 'IDR';

export function AccountsScreen() {
  const accounts = useAccounts();
  const createAccount = useCreateAccount();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (!name.trim()) {
      setError('Account name is required');
      return;
    }
    createAccount.mutate(
      { name: name.trim(), type, currency: IDR, institution: null },
      {
        onSuccess: () => {
          setName('');
          setType('bank');
          setShowForm(false);
        },
        onError: (e) => setError(getErrorMessage(e)),
      },
    );
  };

  if (accounts.isLoading) {
    return (
      <Screen header>
        <LoadingView />
      </Screen>
    );
  }
  if (accounts.isError) {
    return (
      <Screen header>
        <ErrorView message={getErrorMessage(accounts.error)} onRetry={accounts.refetch} />
      </Screen>
    );
  }

  return (
    <Screen header scroll refreshing={accounts.isRefetching} onRefresh={accounts.refetch}>
      <View style={styles.header}>
        <Text style={styles.title}>Accounts</Text>
        <Pressable onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addText}>{showForm ? 'Cancel' : '+ Add'}</Text>
        </Pressable>
      </View>

      {showForm && (
        <Card>
          <Input label="Name" placeholder="e.g. GoPay" value={name} onChangeText={setName} />
          <SegmentedControl
            options={ACCOUNT_TYPES.map((t) => ({ value: t, label: t }))}
            value={type}
            onChange={(v) => setType(v as AccountType)}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Button title="Create account" onPress={submit} loading={createAccount.isPending} />
        </Card>
      )}

      {(accounts.data ?? []).map((account) => (
        <Card key={account.id} style={styles.row}>
          <Text style={styles.name}>{account.name}</Text>
          <Text style={styles.meta}>{account.type.replace('_', ' ')}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.title, color: colors.text },
  addText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  error: { ...typography.caption, color: colors.negative },
  row: { borderRadius: radius.lg, gap: 2 },
  name: { ...typography.heading, color: colors.text },
  meta: { ...typography.caption, color: colors.textMuted, textTransform: 'capitalize' },
});
