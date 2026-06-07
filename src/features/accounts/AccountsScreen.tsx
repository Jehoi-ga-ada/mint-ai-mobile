import { useState } from 'react';
import { ActionSheetIOS, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../../api/client';
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from '../../api/hooks';
import type { Account, AccountType } from '../../api/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import { ErrorView, LoadingView } from '../../components/StateView';
import { useMoneyStore } from '../../money/moneyStore';
import { colors, radius, typography } from '../../theme';

// Money-manager accounts only (IDR). Investment custody lives under Portfolios.
const ACCOUNT_TYPES: AccountType[] = ['bank', 'cash', 'ewallet'];
const IDR = 'IDR';

function showAccountActions(account: Account, onEdit: () => void, onDelete: () => void) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: account.name,
        options: ['Edit', 'Delete', 'Cancel'],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 2,
      },
      (index) => {
        if (index === 0) {
          onEdit();
        } else if (index === 1) {
          onDelete();
        }
      },
    );
    return;
  }
  Alert.alert(account.name, undefined, [
    { text: 'Edit', onPress: onEdit },
    { text: 'Delete', style: 'destructive', onPress: onDelete },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

export function AccountsScreen() {
  const accounts = useAccounts();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setShowForm(false);
    setEditing(null);
    setName('');
    setType('bank');
    setError(null);
  };

  const startEdit = (account: Account) => {
    setEditing(account);
    setName(account.name);
    setType(account.type);
    setError(null);
    setShowForm(true);
  };

  const confirmDelete = (account: Account) => {
    const all = accounts.data ?? [];
    if (all.length <= 1) {
      Alert.alert('Cannot delete', 'You need at least one account for transactions.');
      return;
    }
    const txnCount = useMoneyStore
      .getState()
      .transactions.filter((t) => t.account_id === account.id).length;
    const detail =
      txnCount > 0
        ? `${txnCount} transaction${txnCount === 1 ? '' : 's'} on this account will be deleted too.`
        : 'This account has no transactions.';
    Alert.alert(`Delete ${account.name}?`, detail, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAccount.mutate(account.id);
          if (editing?.id === account.id) {
            resetForm();
          }
        },
      },
    ]);
  };

  const submit = () => {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Account name is required');
      return;
    }
    if (editing) {
      updateAccount.mutate(
        { id: editing.id, name: trimmed, type },
        { onSuccess: resetForm, onError: (e) => setError(getErrorMessage(e)) },
      );
      return;
    }
    createAccount.mutate(
      { name: trimmed, type, currency: IDR, institution: null },
      { onSuccess: resetForm, onError: (e) => setError(getErrorMessage(e)) },
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
        <Pressable onPress={() => (showForm ? resetForm() : setShowForm(true))}>
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
          <Button
            title={editing ? 'Save changes' : 'Create account'}
            onPress={submit}
            loading={createAccount.isPending || updateAccount.isPending}
          />
        </Card>
      )}

      {(accounts.data ?? []).map((account) => (
        <Pressable
          key={account.id}
          onPress={() =>
            showAccountActions(
              account,
              () => startEdit(account),
              () => confirmDelete(account),
            )
          }
          accessibilityRole="button"
          accessibilityLabel={`${account.name} — tap for actions`}
        >
          <Card style={styles.row}>
            <Text style={styles.name}>{account.name}</Text>
            <Text style={styles.meta}>{account.type.replace('_', ' ')}</Text>
          </Card>
        </Pressable>
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
