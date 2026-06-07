import { type GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

import { colors, typography } from '../../theme';
import { donutArcs, sliceIndexAtPoint } from './geometry';
import type { Segment } from './segments';

/** Circumference units of background showing between slices so adjacent
 * colors stay distinguishable. */
const SLICE_SEPARATOR = 3;
/** Non-selected slices fade so the tapped one pops. */
const DIMMED_OPACITY = 0.3;

interface DonutChartProps {
  segments: Segment[];
  size?: number;
  strokeWidth?: number;
  centerValue?: string;
  centerLabel?: string;
  /** Tint for the center value (e.g. red for expense, green for income). */
  centerValueColor?: string;
  /** Formats a slice's value for the tap-to-inspect center readout. */
  formatValue?: (value: number) => string;
  /** Controlled selection (pair with useSliceSelection so the legend stays in
   * sync). Providing both makes slices tappable: the center swaps to the
   * selected slice's value and share — the full name lives in the legend row,
   * so nothing ever truncates inside the hole. */
  selectedKey?: string | null;
  onSelect?: (key: string | null) => void;
}

export function DonutChart({
  segments,
  size = 180,
  strokeWidth = 26,
  centerValue,
  centerLabel,
  centerValueColor,
  formatValue,
  selectedKey,
  onSelect,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const arcs = donutArcs(
    segments.map((s) => s.value),
    circumference,
    SLICE_SEPARATOR,
  );

  const selectable = formatValue != null && onSelect != null;
  const selected = selectable ? (segments.find((s) => s.key === selectedKey) ?? null) : null;

  const handlePress = (event: GestureResponderEvent) => {
    if (!onSelect) {
      return;
    }
    const { locationX, locationY } = event.nativeEvent;
    const index = sliceIndexAtPoint(
      locationX,
      locationY,
      size,
      strokeWidth,
      segments.map((s) => s.value),
    );
    onSelect(index === null ? null : segments[index].key);
  };

  const chart = (
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
            opacity={selected && selected.key !== s.key ? DIMMED_OPACITY : 1}
          />
        ))}
      </G>
    </Svg>
  );

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {selectable ? (
        <Pressable onPress={handlePress} accessibilityRole="button" accessibilityLabel="Chart">
          {chart}
        </Pressable>
      ) : (
        chart
      )}
      {(centerValue || centerLabel || selected) && (
        <View style={styles.center} pointerEvents="none">
          {selected && formatValue != null ? (
            <>
              <Text style={[styles.centerValue, { color: selected.color }]}>
                {formatValue(selected.value)}
              </Text>
              <Text style={styles.centerLabel}>{selected.pct.toFixed(1)}% of total</Text>
            </>
          ) : (
            <>
              {!!centerValue && (
                <Text
                  style={[styles.centerValue, centerValueColor ? { color: centerValueColor } : null]}
                >
                  {centerValue}
                </Text>
              )}
              {!!centerLabel && <Text style={styles.centerLabel}>{centerLabel}</Text>}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  center: { position: 'absolute', alignItems: 'center', maxWidth: '64%' },
  centerValue: { ...typography.heading, color: colors.text },
  centerLabel: { ...typography.caption, color: colors.textMuted },
});
