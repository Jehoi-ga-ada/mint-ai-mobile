import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { getErrorMessage } from '../../api/client';
import { useCreatePortfolio } from '../../api/hooks';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import type { PortfolioStackScreenProps } from '../../navigation/types';
import { colors, typography } from '../../theme';

export function CreatePortfolioScreen({
  navigation,
}: PortfolioStackScreenProps<'CreatePortfolio'>) {
  const createPortfolio = useCreatePortfolio();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    if (!name.trim()) {
      setError('Portfolio name is required');
      return;
    }
    createPortfolio.mutate(
      { name: name.trim() },
      {
        onSuccess: () => navigation.goBack(),
        onError: (e) => setError(getErrorMessage(e)),
      },
    );
  };

  return (
    <Screen header>
      <Card>
        <Input
          label="Portfolio name"
          placeholder="e.g. Long-term, Crypto"
          value={name}
          onChangeText={setName}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Button title="Create portfolio" onPress={submit} loading={createPortfolio.isPending} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { ...typography.caption, color: colors.negative },
});
