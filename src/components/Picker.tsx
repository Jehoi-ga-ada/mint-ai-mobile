import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  Modal,
  Platform,
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

// Above this many options, show a search field so the user can filter instead
// of scrolling a long list (HIG: long selections want search, not a giant sheet).
const SEARCH_THRESHOLD = 8;

/** A select control presented as a sheet of tappable tiles in a 2-column grid —
 * scannable at a glance and mostly fits on one screen, so there's far less
 * scrolling than a long list. Adds a search field for large option sets and an
 * inline "add new" shortcut. Consistent on iOS and Android. */
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
  // Track the keyboard frame so the sheet rises exactly with it (matching iOS's
  // animation curve/duration) — no lurch and no dim gap below the sheet.
  const kbHeight = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, (e) => {
      Animated.timing(kbHeight, {
        toValue: e.endCoordinates.height,
        duration: e.duration ?? 250,
        useNativeDriver: false,
      }).start();
    });
    const hide = Keyboard.addListener(hideEvt, (e) => {
      Animated.timing(kbHeight, {
        toValue: 0,
        duration: e.duration ?? 250,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [kbHeight]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const selected = options.find((o) => o.value === value);
  const showSearch = options.length > SEARCH_THRESHOLD;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
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
        <Animated.View style={[styles.overlay, { paddingBottom: kbHeight }]}>
          <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.grabber} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
                <Icon name="close" color={colors.textMuted} size={22} />
              </Pressable>
            </View>

            {showSearch && (
              <TextInput
                style={styles.search}
                placeholder={`Search ${label.toLowerCase()}…`}
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            )}

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
              data={filtered}
              keyExtractor={(o) => o.value}
              numColumns={2}
              columnWrapperStyle={styles.gridRow}
              style={styles.grid}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={styles.empty}>No matches</Text>}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    style={[styles.tile, active && styles.tileActive]}
                    onPress={() => {
                      onChange(item.value);
                      close();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected: active }}
                  >
                    <Text
                      style={[styles.tileText, active && styles.tileTextActive]}
                      numberOfLines={2}
                    >
                      {item.label}
                    </Text>
                    {active && (
                      <View style={styles.tileCheck}>
                        <Icon name="check" color={colors.primary} size={16} />
                      </View>
                    )}
                  </Pressable>
                );
              }}
            />
          </View>
        </Animated.View>
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
    paddingTop: spacing.sm,
    maxHeight: '80%',
    gap: spacing.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: { ...typography.heading, color: colors.text },
  search: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
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
  grid: { flexGrow: 0 },
  gridRow: { gap: spacing.sm },
  tile: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    justifyContent: 'center',
  },
  tileActive: { borderColor: colors.primary, backgroundColor: colors.surface },
  tileText: { ...typography.body, color: colors.text },
  tileTextActive: { color: colors.primary, fontWeight: '600' },
  tileCheck: { position: 'absolute', top: spacing.xs, right: spacing.xs },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
});
