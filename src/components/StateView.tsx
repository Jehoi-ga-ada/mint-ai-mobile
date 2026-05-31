import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';
import { Button } from './Button';

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorText}>{message}</Text>
      {onRetry && <Button title="Retry" variant="secondary" onPress={onRetry} />}
    </View>
  );
}

interface EmptyViewProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyView({ message, actionLabel, onAction }: EmptyViewProps) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyText}>{message}</Text>
      {actionLabel && onAction && (
        <Button title={actionLabel} variant="secondary" onPress={onAction} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: { ...typography.body, color: colors.negative, textAlign: 'center' },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
