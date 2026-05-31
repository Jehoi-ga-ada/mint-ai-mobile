import { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../theme';
import { Icon } from './Icon';

export interface PickerOption {
  value: string;
  label: string;
}

interface PickerProps {
  label: string;
  options: PickerOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Optional semantic color for the selected value text (e.g. green buy / red sell). */
  valueColor?: string;
  /** When provided, shows an inline "+ create" shortcut that returns the new id. */
  onCreate?: (name: string) => Promise<string | null>;
  createLabel?: string;
}

/** A tap-to-open modal list — replaces horizontal scroll pickers. Shows every
 * option vertically and optionally an inline "add new" shortcut. */
export function Picker({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  valueColor,
  onCreate,
  createLabel = 'Add new',
}: PickerProps) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selected = options.find((o) => o.value === value);

  const close = () => {
    setOpen(false);
    setAdding(false);
    setName('');
    setCreateError(null);
  };

  const submitNew = async () => {
    if (!onCreate || !name.trim()) {
      return;
    }
    setBusy(true);
    setCreateError(null);
    try {
      const id = await onCreate(name.trim());
      if (id) {
        onChange(id);
      }
      close();
    } catch {
      setCreateError("Couldn't create — try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={styles.field}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
      >
        <Text
          style={[
            styles.fieldText,
            !selected && styles.placeholder,
            selected && valueColor ? [styles.valueStrong, { color: valueColor }] : null,
          ]}
        >
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevronRight" color={colors.textMuted} size={18} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
                <Icon name="close" color={colors.textMuted} size={22} />
              </Pressable>
            </View>

            {onCreate &&
              (adding ? (
                <View style={styles.addWrap}>
                  <View style={styles.addRow}>
                    <TextInput
                      style={styles.addInput}
                      placeholder="Name"
                      placeholderTextColor={colors.textMuted}
                      value={name}
                      onChangeText={setName}
                      autoFocus
                      onSubmitEditing={submitNew}
                    />
                    <Pressable
                      style={[styles.addBtn, busy && styles.disabled]}
                      onPress={submitNew}
                      disabled={busy}
                      accessibilityRole="button"
                      accessibilityLabel="Save new"
                    >
                      <Icon name="check" color={colors.background} size={20} />
                    </Pressable>
                  </View>
                  {!!createError && <Text style={styles.errorText}>{createError}</Text>}
                </View>
              ) : (
                <Pressable
                  style={styles.createRow}
                  onPress={() => setAdding(true)}
                  accessibilityRole="button"
                  accessibilityLabel={createLabel}
                >
                  <Icon name="plus" color={colors.primary} size={18} />
                  <Text style={styles.createText}>{createLabel}</Text>
                </Pressable>
              ))}

            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    style={styles.option}
                    onPress={() => {
                      onChange(item.value);
                      close();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {item.label}
                    </Text>
                    {active && <Icon name="check" color={colors.primary} size={20} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
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
  valueStrong: { fontWeight: '600' },
  placeholder: { color: colors.textMuted },
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '70%',
    gap: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: { ...typography.heading, color: colors.text },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  createText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  addWrap: { gap: spacing.xs },
  addRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  errorText: { ...typography.caption, color: colors.negative },
  addInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 46,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  optionText: { ...typography.body, color: colors.text },
  optionTextActive: { color: colors.primary, fontWeight: '600' },
});
