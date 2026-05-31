import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import { toISODate } from '../utils/dateRange';
import { Icon } from './Icon';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CalendarRangePickerProps {
  start: Date | null;
  end: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** In-app range calendar — tap a start day, then an end day. Pure RN (no native picker). */
export function CalendarRangePicker({ start, end, onChange }: CalendarRangePickerProps) {
  const [view, setView] = useState<Date>(() => startOfMonth(start ?? new Date()));

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(year, month, d));
  }

  const onTapDay = (day: Date) => {
    // No selection yet, or restarting after a full range → set start.
    if (!start || (start && end) || day < start) {
      onChange(day, null);
    } else {
      onChange(start, day);
    }
  };

  const iso = (d: Date | null) => (d ? toISODate(d) : null);
  const isEdge = (day: Date) => iso(day) === iso(start) || iso(day) === iso(end);
  const inRange = (day: Date) => !!start && !!end && day >= start && day <= end;

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Pressable
          onPress={() => setView(new Date(year, month - 1, 1))}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          hitSlop={8}
          style={styles.navBtn}
        >
          <Icon name="chevronLeft" color={colors.primary} size={22} />
        </Pressable>
        <Text style={styles.monthLabel}>
          {view.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <Pressable
          onPress={() => setView(new Date(year, month + 1, 1))}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          hitSlop={8}
          style={styles.navBtn}
        >
          <Icon name="chevronRight" color={colors.primary} size={22} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) =>
          day === null ? (
            <View key={`e${i}`} style={styles.cell} />
          ) : (
            <Pressable
              key={iso(day)}
              style={[styles.cell, inRange(day) && styles.cellInRange, isEdge(day) && styles.cellEdge]}
              onPress={() => onTapDay(day)}
              accessibilityRole="button"
              accessibilityLabel={iso(day) ?? undefined}
            >
              <Text style={[styles.dayText, isEdge(day) && styles.dayTextEdge]}>
                {day.getDate()}
              </Text>
            </Pressable>
          ),
        )}
      </View>

      <Text style={styles.footer}>
        {iso(start) ?? 'Start'} → {iso(end) ?? 'End'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { padding: spacing.xs },
  monthLabel: { ...typography.heading, color: colors.text },
  weekRow: { flexDirection: 'row' },
  weekday: {
    ...typography.caption,
    color: colors.textMuted,
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 1,
  },
  cellInRange: { backgroundColor: colors.surfaceAlt },
  cellEdge: { backgroundColor: colors.primary, borderRadius: radius.sm },
  dayText: { ...typography.body, color: colors.text },
  dayTextEdge: { color: colors.background, fontWeight: '700' },
  footer: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
});
