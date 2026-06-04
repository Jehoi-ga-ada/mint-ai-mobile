import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../theme';
import { toISODate } from '../utils/dateRange';
import { Icon } from './Icon';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface DateFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

/** A field that opens a date picker. iOS uses the native inline UIDatePicker;
 * Android uses a custom month calendar to match the dark theme. */
export function DateField(props: DateFieldProps) {
  if (Platform.OS === 'ios') {
    return <IOSDateField {...props} />;
  }
  return <AndroidDateField {...props} />;
}

/** Shared trigger field showing the selected date. */
function DateFieldTrigger({
  label,
  value,
  onPress,
}: {
  label: string;
  value: Date;
  onPress: () => void;
}) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={styles.field}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${toISODate(value)}`}
      >
        <Text style={styles.fieldText}>{toISODate(value)}</Text>
        <Icon name="calendar" color={colors.textMuted} size={18} />
      </Pressable>
    </View>
  );
}

function IOSDateField({ label, value, onChange }: DateFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);

  const onPickerChange = (_event: DateTimePickerChangeEvent, date: Date) => {
    if (date) {
      setDraft(date);
    }
  };

  const done = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <>
      <DateFieldTrigger
        label={label}
        value={value}
        onPress={() => {
          setDraft(value);
          setOpen(true);
        }}
      />

      <Modal visible={open} transparent animationType="slide" onRequestClose={done}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={done} accessibilityLabel="Close" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.header}>
              <Text style={styles.monthLabel}>{label}</Text>
              <Pressable onPress={done} accessibilityRole="button" accessibilityLabel="Done" hitSlop={8}>
                <Text style={styles.doneText}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={draft}
              mode="date"
              display="inline"
              themeVariant="dark"
              accentColor={colors.primary}
              onValueChange={onPickerChange}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

function AndroidDateField({ label, value, onChange }: DateFieldProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));

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

  const iso = (d: Date | null) => (d ? toISODate(d) : null);

  return (
    <>
      <DateFieldTrigger
        label={label}
        value={value}
        onPress={() => {
          setView(new Date(value.getFullYear(), value.getMonth(), 1));
          setOpen(true);
        }}
      />

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close"
          />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
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
                    style={[styles.cell, iso(day) === iso(value) && styles.cellActive]}
                    onPress={() => {
                      onChange(day);
                      setOpen(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={iso(day) ?? undefined}
                  >
                    <Text style={[styles.dayText, iso(day) === iso(value) && styles.dayActive]}>
                      {day.getDate()}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { ...typography.caption, color: colors.textMuted },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  fieldText: { ...typography.body, color: colors.text },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  doneText: { ...typography.heading, color: colors.primary },
  navBtn: { padding: spacing.xs },
  monthLabel: { ...typography.heading, color: colors.text },
  weekRow: { flexDirection: 'row' },
  weekday: { ...typography.caption, color: colors.textMuted, width: `${100 / 7}%`, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 1,
  },
  cellActive: { backgroundColor: colors.primary, borderRadius: radius.sm },
  dayText: { ...typography.body, color: colors.text },
  dayActive: { color: colors.background, fontWeight: '700' },
});
