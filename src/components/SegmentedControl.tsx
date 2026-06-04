import RNSegmentedControl from '@react-native-segmented-control/segmented-control';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

// Native UISegmentedControl font props expect a plain { color, fontWeight }
// object (its own FontStyle type, color: string), so they live as constants.
const NATIVE_FONT = { color: colors.textMuted } as const;
const NATIVE_ACTIVE_FONT = { color: colors.background, fontWeight: '600' } as const;

export interface SegmentOption {
  value: string;
  label: string;
  /** Semantic highlight color when active (e.g. red for expense, green for income). */
  activeColor?: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Compact toggle for 2–3 mutually exclusive options. iOS uses the native
 * UISegmentedControl; Android uses a custom track to match the dark theme. */
export function SegmentedControl(props: SegmentedControlProps) {
  if (Platform.OS === 'ios') {
    return <NativeSegmentedControl {...props} />;
  }
  return <CustomSegmentedControl {...props} />;
}

function NativeSegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const activeColor = options[selectedIndex]?.activeColor ?? colors.primary;

  return (
    <RNSegmentedControl
      values={options.map((o) => o.label)}
      selectedIndex={selectedIndex}
      onChange={(event) => {
        const next = options[event.nativeEvent.selectedSegmentIndex];
        if (next) {
          onChange(next.value);
        }
      }}
      appearance="dark"
      tintColor={activeColor}
      fontStyle={NATIVE_FONT}
      activeFontStyle={NATIVE_ACTIVE_FONT}
    />
  );
}

function CustomSegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <View style={styles.track}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityLabel={opt.label}
            accessibilityState={{ selected: active }}
            style={[
              styles.segment,
              active && { backgroundColor: opt.activeColor ?? colors.primary },
            ]}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  label: { ...typography.body, color: colors.textMuted, fontWeight: '600', textTransform: 'capitalize' },
  labelActive: { color: colors.background },
});
