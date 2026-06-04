import { Pressable, StyleSheet } from 'react-native';

import { usePrivacyStore } from '../store/privacyStore';
import { colors, radius } from '../theme';
import { Icon } from './Icon';

/** Eye toggle to mask/unmask money figures (privacy in public). */
export function PrivacyToggle() {
  const hidden = usePrivacyStore((s) => s.hidden);
  const toggle = usePrivacyStore((s) => s.toggle);
  return (
    <Pressable
      onPress={toggle}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={hidden ? 'Show balances' : 'Hide balances'}
      style={styles.btn}
    >
      <Icon name={hidden ? 'eyeOff' : 'eye'} color={colors.text} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    // HIG: tappable controls should be at least 44×44pt.
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
