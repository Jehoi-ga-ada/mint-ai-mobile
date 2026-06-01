import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}

interface IllustratedStateProps {
  icon: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

/** Shared illustrated empty/error/offline layout: a circular icon badge, a
 * title, optional subtitle, and an optional primary action. */
function IllustratedState({
  icon,
  iconColor = colors.textMuted,
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
}: IllustratedStateProps) {
  return (
    <View style={styles.center} accessibilityRole="summary">
      <View style={styles.badge}>
        <Icon name={icon} color={iconColor} size={28} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button title={actionLabel} variant="secondary" onPress={onAction} />
      )}
      {children}
    </View>
  );
}

interface ErrorViewProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorView({ message, onRetry }: ErrorViewProps) {
  return (
    <IllustratedState
      icon="alertCircle"
      iconColor={colors.negative}
      title="Something went wrong"
      subtitle={message}
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
    />
  );
}

interface OfflineViewProps {
  onRetry?: () => void;
}

/** Full-screen state shown when a screen has no cached data to display while
 * offline. When cached data IS available, screens render it under the slim
 * OfflineBanner instead of this. */
export function OfflineView({ onRetry }: OfflineViewProps) {
  return (
    <IllustratedState
      icon="wifiOff"
      iconColor={colors.warning}
      title="You're offline"
      subtitle="We couldn't load this yet. New transactions you add will save on this device and sync automatically once you're back online."
      actionLabel={onRetry ? 'Try again' : undefined}
      onAction={onRetry}
    />
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
  badge: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { ...typography.heading, color: colors.text, textAlign: 'center' },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
