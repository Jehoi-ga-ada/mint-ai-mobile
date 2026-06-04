import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetworkStore } from '../store/networkStore';
import { colors, radius, spacing, typography } from '../theme';
import { Icon } from './Icon';

const TAB_BAR_HEIGHT = 64;
// Sit above the floating FAB (bottom-right primary action) so the pill never
// covers it; the FAB occupies roughly the next ~90pt above the tab bar.
const FAB_CLEARANCE = 64;

/** Floating, non-blocking status pill pinned just above the tab bar. Money is
 * fully on-device, so there is nothing to sync — this only reassures the user
 * that their data is safe while offline. Renders nothing when online. */
export function OfflineBanner() {
  const insets = useSafeAreaInsets();
  const isOnline = useNetworkStore((s) => s.isOnline);

  if (isOnline) {
    return null;
  }

  return (
    <View
      style={[styles.wrap, { bottom: TAB_BAR_HEIGHT + insets.bottom + FAB_CLEARANCE }]}
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
    >
      <View style={[styles.pill, { borderColor: colors.warning }]}>
        <Icon name="wifiOff" color={colors.warning} size={16} />
        <Text style={styles.text} numberOfLines={1}>
          You&apos;re offline · Money is saved on this device
        </Text>
      </View>
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
