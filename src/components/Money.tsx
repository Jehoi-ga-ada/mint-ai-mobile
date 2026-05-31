import { type StyleProp, Text, type TextStyle } from 'react-native';

import { formatMoney, toNumber } from '../api/format';
import type { Numeric } from '../api/types';
import { usePrivacyStore } from '../store/privacyStore';
import { colors } from '../theme';

interface MoneyProps {
  value: Numeric | null | undefined;
  currency: string;
  /** Color the text green/red based on sign (for P/L). */
  signed?: boolean;
  /** Mask this figure when balance privacy is on. */
  sensitive?: boolean;
  style?: StyleProp<TextStyle>;
}

const MASK = '••••••';

export function Money({ value, currency, signed, sensitive, style }: MoneyProps) {
  const hidden = usePrivacyStore((s) => s.hidden);
  if (sensitive && hidden) {
    return <Text style={style}>{MASK}</Text>;
  }
  const amount = toNumber(value);
  const signColor = amount >= 0 ? colors.positive : colors.negative;
  const prefix = signed && amount > 0 ? '+' : '';
  return (
    <Text style={[signed && { color: signColor }, style]}>
      {prefix}
      {formatMoney(amount, currency)}
    </Text>
  );
}
