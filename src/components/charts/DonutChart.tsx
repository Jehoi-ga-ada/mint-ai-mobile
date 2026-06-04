import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { colors, typography } from '../../theme';
import { donutArcs } from './geometry';
import type { Segment } from './segments';

interface DonutChartProps {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  centerValue?: string;
  centerLabel?: string;
  /** Tint for the center value (e.g. red for expense, green for income). */
  centerValueColor?: string;
}

export function DonutChart({
  segments,
  size = 180,
  strokeWidth = 26,
  centerValue,
  centerLabel,
  centerValueColor,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const arcs = donutArcs(
    segments.map((s) => s.value),
    circumference,
  );

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Rotate so arcs start at 12 o'clock. */}
        <G rotation={-90} origin={`${center}, ${center}`}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.surfaceAlt}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {segments.map((s, i) => (
            <Circle
              key={s.key}
              cx={center}
              cy={center}
              r={radius}
              stroke={s.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${arcs[i].dash} ${arcs[i].gap}`}
              strokeDashoffset={arcs[i].offset}
              strokeLinecap="butt"
            />
          ))}
        </G>
      </Svg>
      {(centerValue || centerLabel) && (
        <View style={styles.center} pointerEvents="none">
          {!!centerValue && (
            <Text style={[styles.centerValue, centerValueColor ? { color: centerValueColor } : null]}>
              {centerValue}
            </Text>
          )}
          {!!centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  centerValue: { ...typography.heading, color: colors.text },
  centerLabel: { ...typography.caption, color: colors.textMuted },
});
