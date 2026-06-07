import { usePreventRemove } from '@react-navigation/native';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { getErrorMessage } from '../../api/client';
import { parseDecimalInput, toNumber } from '../../api/format';
import {
  useAccounts,
  useCategories,
  useCreateAccount,
  useCreateCategory,
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
} from '../../api/hooks';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { DateField } from '../../components/DateField';
import { Input } from '../../components/Input';
import { Picker } from '../../components/Picker';
import { Screen } from '../../components/Screen';
import { SegmentedControl } from '../../components/SegmentedControl';
import { ErrorView, LoadingView } from '../../components/StateView';
import type { MoneyStackScreenProps } from '../../navigation/types';
import { usePrefsStore } from '../../store/prefsStore';
import { colors, spacing, typography } from '../../theme';

const IDR = 'IDR';
type TxnType = 'expense' | 'income';

export function AddTransactionScreen({
  route,
  navigation,
}: MoneyStackScreenProps<'AddTransaction'>) {
  const editing = route.params?.transaction;
  const [type, setType] = useState<TxnType>((editing?.type as TxnType) ?? 'expense');
  const accounts = useAccounts();
  const categories = useCategories(type); // income & expense have separate sets
  const createTxn = useCreateTransaction();
  const updateTxn = useUpdateTransaction();
  const deleteTxn = useDeleteTransaction();
  const createCategory = useCreateCategory();
  const createAccount = useCreateAccount();

  const lastAccountId = usePrefsStore((s) => s.lastAccountId);
  const lastExpenseCat = usePrefsStore((s) => s.lastExpenseCategoryId);
  const lastIncomeCat = usePrefsStore((s) => s.lastIncomeCategoryId);
  const rememberAccount = usePrefsStore((s) => s.rememberAccount);
  const rememberCategory = usePrefsStore((s) => s.rememberCategory);
  const lastCatForType = type === 'income' ? lastIncomeCat : lastExpenseCat;

  const [accountId, setAccountId] = useState<string | null>(editing?.account_id ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(editing?.category_id ?? null);
  const [date, setDate] = useState<Date>(editing ? new Date(editing.date) : new Date());
  const [amount, setAmount] = useState(editing ? String(toNumber(editing.amount)) : '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  // Native iOS dismissal: swipe-down to close (no Cancel button). If the form
  // has unsaved input, confirm before discarding — matching Apple's behavior.
  const bypassDiscard = useRef(false);
  const isDirty = editing
    ? amount !== String(toNumber(editing.amount)) ||
      note !== (editing.note ?? '') ||
      categoryId !== editing.category_id ||
      accountId !== editing.account_id
    : amount.trim() !== '' || note.trim() !== '';

  usePreventRemove(isDirty, ({ data }) => {
    if (bypassDiscard.current) {
      navigation.dispatch(data.action);
      return;
    }
    Alert.alert('Discard transaction?', 'Your changes won’t be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
    ]);
  });

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? 'Edit transaction' : 'Add transaction' });
  }, [navigation, editing]);

  // Default the account to the last one used (e.g. BCA) once accounts load.
  useEffect(() => {
    const list = accounts.data ?? [];
    if (!accountId && lastAccountId && list.some((a) => a.id === lastAccountId)) {
      setAccountId(lastAccountId);
    }
  }, [accounts.data, lastAccountId, accountId]);

  // Category sets differ by type — keep a valid pick, else default to last-used.
  useEffect(() => {
    const list = categories.data ?? [];
    setCategoryId((cur) => {
      if (cur && list.some((c) => c.id === cur)) {
        return cur;
      }
      if (lastCatForType && list.some((c) => c.id === lastCatForType)) {
        return lastCatForType;
      }
      return null;
    });
  }, [categories.data, lastCatForType]);

  if (accounts.isLoading || categories.isLoading) {
    return (
      <Screen header>
        <LoadingView />
      </Screen>
    );
  }
  if (accounts.isError || categories.isError) {
    return (
      <Screen header>
        <ErrorView
          message={getErrorMessage(accounts.error ?? categories.error)}
          onRetry={() => {
            accounts.refetch();
            categories.refetch();
          }}
        />
      </Screen>
    );
  }

  const submit = () => {
    setError(null);
    const value = parseDecimalInput(amount);
    if (!accountId || !categoryId) {
      setError('Pick an account and a category');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a valid amount');
      return;
    }
    const payload = {
      date: date.toISOString(),
      type,
      amount: value,
      currency: IDR,
      account_id: accountId,
      category_id: categoryId,
      note: note.trim() || null,
    };
    const opts = {
      onSuccess: () => {
        rememberAccount(accountId);
        rememberCategory(type, categoryId);
        bypassDiscard.current = true; // saved — don't prompt to discard
        navigation.goBack();
      },
      onError: (e: unknown) => setError(getErrorMessage(e)),
    };
    if (editing) {
      updateTxn.mutate({ id: editing.id, payload, original: editing }, opts);
    } else {
      createTxn.mutate(payload, opts);
    }
  };

  const confirmDelete = () => {
    if (!editing) {
      return;
    }
    Alert.alert('Delete transaction', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteTxn.mutate(
            { id: editing.id, original: editing },
            {
              onSuccess: () => {
                bypassDiscard.current = true;
                navigation.goBack();
              },
              onError: (e) => setError(getErrorMessage(e)),
            },
          ),
      },
    ]);
  };

  const pending = createTxn.isPending || updateTxn.isPending;

  return (
    <Screen header scroll>
      <Card>
        <SegmentedControl
          options={[
            { value: 'expense', label: 'Expense', activeColor: colors.negative },
            { value: 'income', label: 'Income', activeColor: colors.positive },
          ]}
          value={type}
          onChange={(v) => setType(v as TxnType)}
        />
        <DateField label="Date" value={date} onChange={setDate} />
        <Picker
          label="Account"
          placeholder="Select account"
          options={(accounts.data ?? []).map((a) => ({ value: a.id, label: a.name }))}
          value={accountId}
          onChange={setAccountId}
          createLabel="New account"
          onCreate={async (name) => {
            const acc = await createAccount.mutateAsync({
              name,
              type: 'cash',
              currency: IDR,
              institution: null,
            });
            return acc.id;
          }}
        />
        <Picker
          label="Category"
          placeholder="Select category"
          options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
          value={categoryId}
          onChange={setCategoryId}
          createLabel={`New ${type} category`}
          onCreate={async (name) => {
            const cat = await createCategory.mutateAsync({ name, kind: type });
            return cat.id;
          }}
        />
        <Input label="Amount (IDR)" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        <Input label="Note (optional)" value={note} onChangeText={setNote} />

        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button title={editing ? 'Save changes' : 'Save'} onPress={submit} loading={pending} />
        {editing && (
          <Button
            title="Delete"
            variant="secondary"
            onPress={confirmDelete}
            loading={deleteTxn.isPending}
            style={styles.delete}
          />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { ...typography.caption, color: colors.negative },
  delete: { marginTop: spacing.sm },
});
