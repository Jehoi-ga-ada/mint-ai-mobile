import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

import { AuthGate } from '../../components/AuthGate';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { colors, radius, spacing, typography } from '../../theme';
import { type ChatMessageView, MAX_ATTACHED_IMAGES, lastUserMessage } from './chatModel';
import { useChatStore } from './chatStore';
import { ChatBubble } from './ChatBubble';

/** The iOS floating tab bar overlays content (reserves no space), so the
 * composer needs clearance when the keyboard is closed. */
const TAB_BAR_CLEARANCE = Platform.OS === 'ios' ? 92 : 0;
const INPUT_MAX_HEIGHT = 120;
const ATTACH_THUMB = 56;

const SUGGESTIONS = [
  'What moved Bitcoin this week?',
  'How are gold prices trending?',
  'Explain dollar-cost averaging',
];

export function AssistantScreen() {
  return (
    <AuthGate reason="The AI assistant analyzes markets on the server, so it needs an account.">
      <ChatContent />
    </AuthGate>
  );
}

function ChatContent() {
  const messages = useChatStore((s) => s.messages);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const editingId = useChatStore((s) => s.editingId);
  const hydrated = useChatStore((s) => s.hydrated);

  const [draft, setDraft] = useState('');
  const [attached, setAttached] = useState<string[]>([]);

  useEffect(() => {
    if (!hydrated) {
      useChatStore.getState().hydrate();
    }
  }, [hydrated]);

  // Track the keyboard frame directly (KeyboardAvoidingView mis-measures under
  // the floating tab bar and leaves the composer behind the keyboard). The
  // composer rides the keyboard's own animation, mirroring Picker.tsx.
  const bottomSpace = useRef(new Animated.Value(TAB_BAR_CLEARANCE)).current;
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }
    const show = Keyboard.addListener('keyboardWillShow', (e) => {
      Animated.timing(bottomSpace, {
        toValue: e.endCoordinates.height + spacing.sm,
        duration: e.duration ?? 250,
        useNativeDriver: false,
      }).start();
    });
    const hide = Keyboard.addListener('keyboardWillHide', (e) => {
      Animated.timing(bottomSpace, {
        toValue: TAB_BAR_CLEARANCE,
        duration: e.duration ?? 250,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [bottomSpace]);

  // Inverted list renders newest first, so streaming tokens stay in view.
  const reversed = useMemo(() => [...messages].reverse(), [messages]);
  const canUndo = !isStreaming && lastUserMessage(messages) !== null;

  const fillComposer = (message: ChatMessageView) => {
    setDraft(message.text);
    setAttached(message.images);
  };

  const handleSend = () => {
    useChatStore.getState().send(draft, attached);
    setDraft('');
    setAttached([]);
  };

  const handleEdit = (id: string) => {
    const target = useChatStore.getState().startEdit(id);
    if (target) {
      fillComposer(target);
    }
  };

  const handleCancelEdit = () => {
    useChatStore.getState().cancelEdit();
    setDraft('');
    setAttached([]);
  };

  const handleUndoFrom = (id: string) => {
    const removed = useChatStore.getState().undoFrom(id);
    if (removed) {
      fillComposer(removed);
    }
  };

  const handleUndoLast = () => {
    const removed = useChatStore.getState().undoLast();
    if (removed) {
      fillComposer(removed);
    }
  };

  const handleClear = () => {
    Alert.alert('New chat', 'This clears the current conversation.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => useChatStore.getState().clear() },
    ]);
  };

  const pickImages = async () => {
    const remaining = MAX_ATTACHED_IMAGES - attached.length;
    if (remaining <= 0) {
      return;
    }
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      selectionLimit: remaining,
      maxWidth: 1280,
      maxHeight: 1280,
      quality: 0.7,
    });
    const picked = (result.assets ?? [])
      .filter((asset) => asset.base64)
      .map((asset) => `data:${asset.type ?? 'image/jpeg'};base64,${asset.base64}`);
    if (picked.length > 0) {
      setAttached((prev) => [...prev, ...picked].slice(0, MAX_ATTACHED_IMAGES));
    }
  };

  const canSend = !isStreaming && (draft.trim().length > 0 || attached.length > 0);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Assistant</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={handleUndoLast}
            disabled={!canUndo}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="Undo last message"
          >
            <Icon name="undo" color={canUndo ? colors.text : colors.border} size={20} />
          </Pressable>
          <Pressable
            onPress={handleClear}
            disabled={messages.length === 0}
            style={styles.headerBtn}
            accessibilityRole="button"
            accessibilityLabel="New chat"
          >
            <Icon
              name="trash"
              color={messages.length > 0 ? colors.text : colors.border}
              size={20}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.flex}>
        {/* Tap anywhere in the conversation area to put the keyboard away —
            bubbles consume their own taps, everything else falls through. */}
        <Pressable style={styles.flex} onPress={Keyboard.dismiss} accessible={false}>
          {messages.length === 0 ? (
            <EmptyChat onSuggest={(text) => useChatStore.getState().send(text, [])} />
          ) : (
            <FlatList
              data={reversed}
              inverted
              keyExtractor={(m) => m.id}
              renderItem={({ item }) => (
                <ChatBubble
                  message={item}
                  onEdit={isStreaming ? undefined : handleEdit}
                  onUndoFrom={isStreaming ? undefined : handleUndoFrom}
                  onRetry={isStreaming ? undefined : () => useChatStore.getState().regenerate()}
                />
              )}
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Pressable>

        <Animated.View style={[styles.composerWrap, { marginBottom: bottomSpace }]}>
          {editingId && (
            <View style={styles.editBanner}>
              <Icon name="edit" color={colors.warning} size={14} />
              <Text style={styles.editText}>Editing message — sending replaces what followed</Text>
              <Pressable
                onPress={handleCancelEdit}
                accessibilityRole="button"
                accessibilityLabel="Cancel edit"
                hitSlop={8}
              >
                <Icon name="close" color={colors.textMuted} size={16} />
              </Pressable>
            </View>
          )}
          {attached.length > 0 && (
            <View style={styles.attachRow}>
              {attached.map((uri, index) => (
                <View key={index} style={styles.attachThumbWrap}>
                  <Image source={{ uri }} style={styles.attachThumb} />
                  <Pressable
                    style={styles.attachRemove}
                    onPress={() => setAttached((prev) => prev.filter((_, i) => i !== index))}
                    accessibilityRole="button"
                    accessibilityLabel="Remove image"
                    hitSlop={6}
                  >
                    <Icon name="close" color={colors.text} size={12} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
          <View style={styles.composer}>
            <Pressable
              onPress={pickImages}
              disabled={isStreaming || attached.length >= MAX_ATTACHED_IMAGES}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Attach image"
            >
              <Icon
                name="image"
                color={attached.length >= MAX_ATTACHED_IMAGES ? colors.border : colors.textMuted}
                size={22}
              />
            </Pressable>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder="Ask about markets…"
              placeholderTextColor={colors.textMuted}
              multiline
              accessibilityLabel="Message"
            />
            {isStreaming ? (
              <Pressable
                onPress={() => useChatStore.getState().stop()}
                style={[styles.sendBtn, styles.stopBtn]}
                accessibilityRole="button"
                accessibilityLabel="Stop generating"
              >
                <Icon name="stop" color={colors.text} size={18} />
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSend}
                disabled={!canSend}
                style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Send"
              >
                <Icon name="arrowUp" color={canSend ? colors.background : colors.textMuted} size={18} />
              </Pressable>
            )}
          </View>
        </Animated.View>
      </View>
    </Screen>
  );
}

function EmptyChat({ onSuggest }: { onSuggest: (text: string) => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.badge}>
        <Icon name="sparkles" color={colors.primary} size={30} />
      </View>
      <Text style={styles.emptyTitle}>Ask Mint</Text>
      <Text style={styles.emptySubtitle}>
        Markets, macro, and your money — with sources. You can attach charts or receipts.
      </Text>
      <View style={styles.suggestions}>
        {SUGGESTIONS.map((text) => (
          <Pressable
            key={text}
            style={styles.chip}
            onPress={() => onSuggest(text)}
            accessibilityRole="button"
            accessibilityLabel={text}
          >
            <Text style={styles.chipText}>{text}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { ...typography.display, color: colors.text },
  headerActions: { flexDirection: 'row', gap: spacing.xs },
  headerBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingBottom: spacing.sm },
  composerWrap: { gap: spacing.sm },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    maxHeight: INPUT_MAX_HEIGHT,
    paddingVertical: spacing.sm,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.surfaceAlt },
  stopBtn: { backgroundColor: colors.negative },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  editText: { ...typography.caption, color: colors.textMuted, flex: 1 },
  attachRow: { flexDirection: 'row', gap: spacing.sm },
  attachThumbWrap: { position: 'relative' },
  attachThumb: {
    width: ATTACH_THUMB,
    height: ATTACH_THUMB,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  attachRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { ...typography.title, color: colors.text },
  emptySubtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  suggestions: { gap: spacing.sm, marginTop: spacing.sm, alignItems: 'center' },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipText: { ...typography.body, color: colors.primary },
});
