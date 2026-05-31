import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';

import { toNumber } from '../../api/format';
import type { Numeric } from '../../api/types';
import { colors, spacing, typography } from '../../theme';
import { linePoints, pointsToString } from './geometry';

interface LineChartProps {
  values: (Numeric | null | undefined)[];
  height?: number;
  color?: string;
}

const PAD = 6;

export function LineChart({ values, height = 120, color = colors.primary }: LineChartProps) {
  const [width, setWidth] = useState(0);
  const nums = values.map(toNumber);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  // Compact placeholder until there's a trend to draw (avoids a tall empty block).
  if (nums.length < 2) {
    return (
      <View onLayout={onLayout} style={styles.empty}>
        <Text style={styles.emptyText}>No history yet — a trend appears over the next few days.</Text>
      </View>
    );
  }

  const points = width > 0 ? linePoints(nums, width, height, PAD) : [];
  const areaPath =
    points.length > 0
      ? `M${points[0].x},${height - PAD} ` +
        points.map((p) => `L${p.x},${p.y}`).join(' ') +
        ` L${points[points.length - 1].x},${height - PAD} Z`
      : '';

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Path d={areaPath} fill={color} fillOpacity={0.12} />
          <Polyline
            points={pointsToString(points)}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  emptyText: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
