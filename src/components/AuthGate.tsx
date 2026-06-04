import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { RootStackParamList } from '../navigation/types';
import { useAuthStore } from '../store/authStore';
import { colors, radius, spacing, typography } from '../theme';
import { Button } from './Button';
import { Icon } from './Icon';
import { Screen } from './Screen';

interface AuthGateProps {
  /** Why signing in is needed — shown under the title. */
  reason: string;
  children: ReactNode;
}

/** Gate a feature behind authentication without gating the whole app. When the
 * user is a guest, renders an in-place sign-in prompt instead of `children`;
 * once signed in it reveals `children`. Because it subscribes to auth status, a
 * silent drop to guest (e.g. an expired token) re-gates the feature reactively
 * with no navigation reset. */
export function AuthGate({ reason, children }: AuthGateProps) {
  const status = useAuthStore((s) => s.status);

  if (status === 'authed') {
    return <>{children}</>;
  }
  return <GateView reason={reason} />;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

function GateView({ reason }: { reason: string }) {
  const navigation = useNavigation<Nav>();
  return (
    <Screen>
      <View style={styles.body}>
        <View style={styles.badge}>
          <Icon name="logIn" color={colors.primary} size={28} />
        </View>
        <Text style={styles.title}>Sign in to continue</Text>
        <Text style={styles.reason}>{reason}</Text>
        <View style={styles.actions}>
          <Button title="Sign in" onPress={() => navigation.navigate('Login')} />
          <Button
            title="Create account"
            variant="secondary"
            onPress={() => navigation.navigate('Register')}
          />
        </View>
        <Text style={styles.note}>Your Money tab works offline without an account.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center', gap: spacing.lg },
  badge: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, color: colors.text, textAlign: 'center' },
  reason: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  actions: { gap: spacing.sm, marginTop: spacing.md },
  note: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
