import { useQueryClient } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorCount, pendingCount, useOutboxStore } from '../offline/outbox';
import { flushOutbox } from '../offline/sync';
import { useNetworkStore } from '../store/networkStore';
import { colors, radius, spacing, typography } from '../theme';
import { Icon, type IconName } from './Icon';

const TAB_BAR_HEIGHT = 64;

interface BannerState {
  icon: IconName;
  tint: string;
  text: string;
  actionable: boolean;
}

function resolveState(
  isOnline: boolean,
  pending: number,
  errors: number,
): BannerState | null {
  if (errors > 0) {
    return {
      icon: 'alertCircle',
      tint: colors.negative,
      text: `${errors} change${errors > 1 ? 's' : ''} didn't sync — tap to retry`,
      actionable: true,
    };
  }
  if (!isOnline) {
    return {
      icon: 'wifiOff',
      tint: colors.warning,
      text:
        pending > 0
          ? `Offline · ${pending} change${pending > 1 ? 's' : ''} saved on this device`
          : "You're offline · changes save here and sync later",
      actionable: false,
    };
  }
  if (pending > 0) {
    return {
      icon: 'refresh',
      tint: colors.primary,
      text: `Syncing ${pending} change${pending > 1 ? 's' : ''}…`,
      actionable: false,
    };
  }
  return null;
}

/** Floating, non-blocking status pill pinned just above the tab bar. Reflects
 * connectivity and the sync queue; tappable only when changes have hard-failed
 * (to retry). Renders nothing when online with an empty queue. */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const isOnline = useNetworkStore((s) => s.isOnline);
  const ops = useOutboxStore((s) => s.ops);

  const state = resolveState(isOnline, pendingCount(ops), errorCount(ops));
  if (!state) {
    return null;
  }

  const onRetry = () => {
    useOutboxStore.getState().retryErrors();
    flushOutbox(queryClient);
  };

  const body = (
    <View style={[styles.pill, { borderColor: state.tint }]}>
      <Icon name={state.icon} color={state.tint} size={16} />
      <Text style={styles.text} numberOfLines={1}>
        {state.text}
      </Text>
    </View>
  );

  return (
    <View
      style={[styles.wrap, { bottom: TAB_BAR_HEIGHT + insets.bottom + spacing.sm }]}
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
    >
      {state.actionable ? (
        <Pressable onPress={onRetry} accessibilityRole="button" accessibilityLabel={state.text}>
          {body}
        </Pressable>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    maxWidth: '100%',
  },
  text: { ...typography.caption, color: colors.text, flexShrink: 1 },
});
