import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import {
  type DateRange,
  type RangePreset,
  RANGE_PRESETS,
  rangeForPreset,
  toISODate,
} from '../utils/dateRange';
import { CalendarRangePicker } from './CalendarRangePicker';

interface RangeSelectorProps {
  defaultPreset?: RangePreset;
  /** Seed the custom calendar (e.g. when the default is a billing cycle). */
  initialStart?: Date | null;
  initialEnd?: Date | null;
  onChange: (range: DateRange) => void;
}

function firstOfThisMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function RangeSelector({
  defaultPreset = 'month',
  initialStart = null,
  initialEnd = null,
  onChange,
}: RangeSelectorProps) {
  const [preset, setPreset] = useState<RangePreset>(defaultPreset);
  // Committed custom range (what the screen actually filters by).
  const [committedStart, setCommittedStart] = useState<Date | null>(
    initialStart ?? firstOfThisMonth(),
  );
  const [committedEnd, setCommittedEnd] = useState<Date | null>(initialEnd ?? new Date());
  // Draft range while the calendar is open — nothing applies until "Apply".
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [draftStart, setDraftStart] = useState<Date | null>(committedStart);
  const [draftEnd, setDraftEnd] = useState<Date | null>(committedEnd);

  const openCalendar = () => {
    setDraftStart(committedStart);
    setDraftEnd(committedEnd);
    setCalendarOpen(true);
  };

  const choosePreset = (p: RangePreset) => {
    setPreset(p);
    if (p === 'custom') {
      onChange({ start: committedStart, end: committedEnd });
      openCalendar();
    } else {
      setCalendarOpen(false);
      onChange(rangeForPreset(p, new Date()));
    }
  };

  const applyDraft = () => {
    setCommittedStart(draftStart);
    setCommittedEnd(draftEnd);
    onChange({ start: draftStart, end: draftEnd });
    setCalendarOpen(false);
  };

  const canApply = !!draftStart && !!draftEnd;

  return (
    <View style={styles.wrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {RANGE_PRESETS.map((p) => {
          const active = p.value === preset;
          return (
            <Pressable
              key={p.value}
              onPress={() => choosePreset(p.value)}
              accessibilityRole="button"
              accessibilityLabel={p.label}
              accessibilityState={{ selected: active }}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.label, active && styles.labelActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {preset === 'custom' &&
        (calendarOpen ? (
          <View style={styles.calendar}>
            <CalendarRangePicker
              start={draftStart}
              end={draftEnd}
              onChange={(start, end) => {
                setDraftStart(start);
                setDraftEnd(end);
              }}
            />
            <View style={styles.actions}>
              <Pressable
                style={[styles.action, styles.cancel]}
                onPress={() => setCalendarOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.action, styles.apply, !canApply && styles.disabled]}
                disabled={!canApply}
                onPress={applyDraft}
                accessibilityRole="button"
                accessibilityLabel="Apply date range"
              >
                <Text style={styles.applyText}>Apply</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            style={styles.summary}
            onPress={openCalendar}
            accessibilityRole="button"
            accessibilityLabel="Edit custom date range"
          >
            <Text style={styles.summaryText}>
              {toISODate(committedStart) ?? 'Start'} → {toISODate(committedEnd) ?? 'End'}
            </Text>
            <Text style={styles.summaryEdit}>Change</Text>
          </Pressable>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  row: { gap: spacing.sm },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  labelActive: { color: colors.background },
  calendar: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: { backgroundColor: colors.surfaceAlt },
  cancelText: { ...typography.heading, color: colors.text },
  apply: { backgroundColor: colors.primary },
  applyText: { ...typography.heading, color: colors.background },
  disabled: { opacity: 0.5 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  summaryText: { ...typography.body, color: colors.text },
  summaryEdit: { ...typography.caption, color: colors.primary, fontWeight: '600' },
});
