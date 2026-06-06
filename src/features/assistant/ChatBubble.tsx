import { ActionSheetIOS, Alert, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '../../components/Icon';
import { colors, radius, spacing, typography } from '../../theme';
import type { ChatMessageView } from './chatModel';
import { MarkdownText } from './MarkdownText';

const BUBBLE_MAX_WIDTH = '84%';
const THUMB_SIZE = 132;

interface ChatBubbleProps {
  message: ChatMessageView;
  /** Long-press actions on user messages (disabled while streaming). */
  onEdit?: (id: string) => void;
  onUndoFrom?: (id: string) => void;
  /** Tap-to-retry on a failed assistant reply. */
  onRetry?: () => void;
}

function showUserActions(onEdit: () => void, onUndo: () => void) {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Edit message', 'Undo from here', 'Cancel'],
        destructiveButtonIndex: 1,
        cancelButtonIndex: 2,
      },
      (index) => {
        if (index === 0) {
          onEdit();
        } else if (index === 1) {
          onUndo();
        }
      },
    );
    return;
  }
  Alert.alert('Message', undefined, [
    { text: 'Edit message', onPress: onEdit },
    { text: 'Undo from here', style: 'destructive', onPress: onUndo },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

export function ChatBubble({ message, onEdit, onUndoFrom, onRetry }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const canAct = isUser && onEdit && onUndoFrom;

  const body = (
    <View
      style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
        isError && styles.errorBubble,
      ]}
    >
      {message.images.length > 0 && (
        <View style={styles.imageRow}>
          {message.images.map((uri, index) => (
            <Image
              key={index}
              source={{ uri }}
              style={styles.thumb}
              accessibilityRole="image"
              accessibilityLabel="Attached image"
            />
          ))}
        </View>
      )}
      {message.text.length > 0 &&
        (isUser ? (
          <Text style={styles.text}>{message.text}</Text>
        ) : (
          <MarkdownText text={message.text} />
        ))}
      {message.status === 'streaming' && (
        <Text style={styles.cursor}>{message.text.length > 0 ? '▍' : 'Thinking…'}</Text>
      )}
      {isError && (
        <View style={styles.errorRow}>
          <Icon name="alertCircle" color={colors.negative} size={16} />
          <Text style={styles.errorText}>{message.error ?? 'Something went wrong.'}</Text>
        </View>
      )}
      {isError && !isUser && onRetry && (
        <Pressable
          onPress={onRetry}
          style={styles.retryBtn}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Icon name="refresh" color={colors.primary} size={14} />
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {canAct ? (
        <Pressable
          onLongPress={() =>
            showUserActions(
              () => onEdit(message.id),
              () => onUndoFrom(message.id),
            )
          }
          accessibilityRole="button"
          accessibilityLabel="Message — long-press for actions"
        >
          {body}
        </Pressable>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', marginVertical: spacing.xs },
  rowUser: { alignItems: 'flex-end' },
  rowAssistant: { alignItems: 'flex-start' },
  bubble: {
    maxWidth: BUBBLE_MAX_WIDTH,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.xs,
  },
  userBubble: { backgroundColor: colors.primaryDim, borderBottomRightRadius: radius.sm },
  assistantBubble: { backgroundColor: colors.surfaceAlt, borderBottomLeftRadius: radius.sm },
  errorBubble: { borderWidth: 1, borderColor: colors.negative },
  text: { ...typography.body, color: colors.text, lineHeight: 21 },
  cursor: { ...typography.body, color: colors.textMuted },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  errorText: { ...typography.caption, color: colors.negative, flexShrink: 1 },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  retryText: { ...typography.caption, color: colors.primary, fontWeight: '600' },
});
