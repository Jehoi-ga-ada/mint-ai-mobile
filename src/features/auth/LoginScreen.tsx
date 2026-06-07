import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../../api/client';
import { useLogin } from '../../api/hooks';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import type { RootStackScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

interface LoginForm {
  username: string;
  password: string;
}

export function LoginScreen({ navigation }: RootStackScreenProps<'Login'>) {
  const { control, handleSubmit } = useForm<LoginForm>({
    defaultValues: { username: '', password: '' },
  });
  const login = useLogin();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = handleSubmit((values) => {
    setError(null);
    login.mutate(values, {
      // Dismiss the auth modal back to the tabs; the gated feature reveals itself.
      // Dismiss the auth modal — navigate('Tabs') would push a second Tabs
      // copy on top (react-navigation v7 navigate no longer goes back).
      onSuccess: () => navigation.goBack(),
      onError: (e) => setError(getErrorMessage(e)),
    });
  });

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.brand}>Mint AI</Text>
        <Text style={styles.subtitle}>Track your wealth, end to end.</Text>
      </View>

      <Controller
        control={control}
        name="username"
        rules={{ required: 'Username is required' }}
        render={({ field, fieldState }) => (
          <Input
            label="Username"
            autoCapitalize="none"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        rules={{ required: 'Password is required' }}
        render={({ field, fieldState }) => (
          <Input
            label="Password"
            secureTextEntry
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <Button title="Log in" onPress={onSubmit} loading={login.isPending} />

      <Pressable onPress={() => navigation.replace('Register')}>
        <Text style={styles.link}>No account? Create one</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: spacing.xs, marginBottom: spacing.lg },
  brand: { ...typography.display, color: colors.primary },
  subtitle: { ...typography.body, color: colors.textMuted },
  error: { ...typography.caption, color: colors.negative },
  link: { ...typography.body, color: colors.primary, textAlign: 'center' },
});
