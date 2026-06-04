import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '../../api/client';
import { useLogin, useRegister } from '../../api/hooks';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Screen } from '../../components/Screen';
import type { RootStackScreenProps } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';

interface RegisterForm {
  username: string;
  email: string;
  password: string;
}

export function RegisterScreen({ navigation }: RootStackScreenProps<'Register'>) {
  const { control, handleSubmit, getValues } = useForm<RegisterForm>({
    defaultValues: { username: '', email: '', password: '' },
  });
  const register = useRegister();
  const login = useLogin();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = handleSubmit((values) => {
    setError(null);
    register.mutate(values, {
      // Backend register returns the user but no token — log in straight after.
      onSuccess: () => {
        const { username, password } = getValues();
        login.mutate(
          { username, password },
          { onSuccess: () => navigation.navigate('Tabs') },
        );
      },
      onError: (e) => setError(getErrorMessage(e)),
    });
  });

  const pending = register.isPending || login.isPending;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Create account</Text>
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
        name="email"
        rules={{ required: 'Email is required' }}
        render={({ field, fieldState }) => (
          <Input
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={field.value}
            onChangeText={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        rules={{ required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } }}
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

      <Button title="Sign up" onPress={onSubmit} loading={pending} />

      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: spacing.md },
  title: { ...typography.title, color: colors.text },
  error: { ...typography.caption, color: colors.negative },
  link: { ...typography.body, color: colors.primary, textAlign: 'center' },
});
