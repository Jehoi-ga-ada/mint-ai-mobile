import { usePreventRemove } from '@react-navigation/native';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { getErrorMessage } from '../../api/client';
import { gramsToTroyOz, toNumber } from '../../api/format';
import {
  useAssetPrice,
  useAssets,
  useCreateInvestmentTransaction,
  useDeleteInvestmentTransaction,
  useUpdateInvestmentTransaction,
} from '../../api/hooks';
import type { InvTxnType } from '../../api/types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Picker } from '../../components/Picker';
import { Screen } from '../../components/Screen';
import { ErrorView, LoadingView } from '../../components/StateView';
import type { PortfolioStackScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

const USD = 'USD';
const TXN_TYPES: InvTxnType[] = ['buy', 'sell', 'transfer_in', 'transfer_out', 'dividend'];
const OUTFLOW_TYPES: InvTxnType[] = ['sell', 'transfer_out'];

export function AddInvestmentScreen({
  route,
  navigation,
}: PortfolioStackScreenProps<'AddInvestment'>) {
  const { portfolioId } = route.params;
  const editing = route.params.transaction;
  const assets = useAssets();
  const createTxn = useCreateInvestmentTransaction();
  const updateTxn = useUpdateInvestmentTransaction();
  const deleteTxn = useDeleteInvestmentTransaction();

  const [assetId, setAssetId] = useState<string | null>(editing?.asset_id ?? null);
  const [type, setType] = useState<InvTxnType>(editing?.type ?? 'buy');
  const [quantity, setQuantity] = useState(editing ? String(toNumber(editing.quantity)) : '');
  const [grams, setGrams] = useState('');
  const [price, setPrice] = useState(
    editing ? toNumber(editing.price_per_unit).toFixed(2) : '',
  );
  const [priceEdited, setPriceEdited] = useState(!!editing);
  const [fee, setFee] = useState(editing ? toNumber(editing.fee).toFixed(2) : '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [error, setError] = useState<string | null>(null);

  // Native swipe-to-dismiss with a discard confirmation when there's input.
  const bypassDiscard = useRef(false);
  const isDirty = editing
    ? quantity !== String(toNumber(editing.quantity)) ||
      price !== toNumber(editing.price_per_unit).toFixed(2) ||
      fee !== toNumber(editing.fee).toFixed(2) ||
      note !== (editing.note ?? '') ||
      assetId !== editing.asset_id ||
      type !== editing.type
    : !!assetId || quantity.trim() !== '' || price.trim() !== '' || note.trim() !== '';

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

  const assetPrice = useAssetPrice(assetId);

  const investable = useMemo(
    () => (assets.data ?? []).filter((a) => a.asset_class !== 'cash'),
    [assets.data],
  );
  const selectedAsset = investable.find((a) => a.id === assetId) ?? null;
  const isMetal = selectedAsset?.asset_class === 'metal';

  useLayoutEffect(() => {
    navigation.setOptions({ title: editing ? 'Edit transaction' : 'Add investment' });
  }, [navigation, editing]);

  // Prefill the current USD price when an asset is picked, until the user edits it.
  useEffect(() => {
    if (!priceEdited && assetPrice.data?.available && assetPrice.data.price != null) {
      setPrice(toNumber(assetPrice.data.price).toFixed(2));
    }
  }, [assetPrice.data, priceEdited]);

  if (assets.isLoading) {
    return (
      <Screen header>
        <LoadingView />
      </Screen>
    );
  }
  if (assets.isError) {
    return (
      <Screen header>
        <ErrorView message={getErrorMessage(assets.error)} onRetry={assets.refetch} />
      </Screen>
    );
  }

  const onSelectAsset = (id: string) => {
    setAssetId(id);
    setPriceEdited(false);
    setPrice('');
  };

  const onGramsChange = (text: string) => {
    setGrams(text);
    const g = Number(text);
    if (Number.isFinite(g) && g > 0) {
      setQuantity(gramsToTroyOz(g).toFixed(6));
    }
  };

  const submit = () => {
    setError(null);
    const qty = Number(quantity);
    const unitPrice = Number(price);
    if (!assetId) {
      setError('Pick an asset');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      setError('Enter a valid price');
      return;
    }
    const payload = {
      date: editing?.date ?? new Date().toISOString(),
      type,
      quantity: qty,
      price_per_unit: unitPrice,
      fee: Number(fee) || 0,
      currency: USD,
      portfolio_id: portfolioId,
      asset_id: assetId,
      note: note.trim() || null,
    };
    const opts = {
      onSuccess: () => {
        bypassDiscard.current = true;
        navigation.goBack();
      },
      onError: (e: unknown) => setError(getErrorMessage(e)),
    };
    if (editing) {
      updateTxn.mutate({ id: editing.id, payload }, opts);
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
            { id: editing.id, portfolioId },
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
        <Picker
          label="Asset"
          placeholder="Select asset"
          options={investable.map((a) => ({ value: a.id, label: `${a.symbol} · ${a.name}` }))}
          value={assetId}
          onChange={onSelectAsset}
        />
        <Picker
          label="Type"
          placeholder="Select type"
          options={TXN_TYPES.map((t) => ({ value: t, label: t.replace('_', ' ') }))}
          value={type}
          valueColor={OUTFLOW_TYPES.includes(type) ? colors.negative : colors.positive}
          onChange={(v) => setType(v as InvTxnType)}
        />

        {isMetal && (
          <Input
            label="Grams (auto-converts to troy oz)"
            keyboardType="decimal-pad"
            placeholder="e.g. 50"
            value={grams}
            onChangeText={onGramsChange}
          />
        )}
        <Input
          label={isMetal ? 'Quantity (troy oz)' : 'Quantity'}
          keyboardType="decimal-pad"
          value={quantity}
          onChangeText={setQuantity}
        />
        <Input
          label={
            assetPrice.isFetching && !priceEdited
              ? 'Price per unit (USD) — fetching…'
              : 'Price per unit (USD)'
          }
          keyboardType="decimal-pad"
          value={price}
          onChangeText={(t) => {
            setPriceEdited(true);
            setPrice(t);
          }}
        />
        <Input label="Fee (USD, optional)" keyboardType="decimal-pad" value={fee} onChangeText={setFee} />
        <Input label="Note (optional)" value={note} onChangeText={setNote} />

        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button
          title={editing ? 'Save changes' : 'Save transaction'}
          onPress={submit}
          loading={pending}
        />
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
  error: { ...typography.caption, color: colors.negative, marginTop: spacing.xs },
  delete: { marginTop: spacing.sm },
});
