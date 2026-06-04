import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

interface FabProps {
  label: string;
  onPress: () => void;
}

// On iOS the native tab bar floats over the content (it reserves no layout
// space), so the FAB needs extra clearance to sit above it. Android's custom
// tab bar reserves its own space, so the standard offset is enough.
const FAB_BOTTOM = Platform.OS === 'ios' ? 104 : spacing.xl;

/** Floating primary action, thumb-reachable at the bottom-right. */
export function Fab({ label, onPress }: FabProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
      hitSlop={8}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: FAB_BOTTOM,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  pressed: { opacity: 0.85 },
  label: { ...typography.heading, color: colors.background },
});
