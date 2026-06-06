/** Pure chat-thread helpers — the store mutates state, this file owns the math. */

export type ChatRole = 'user' | 'assistant';
export type ChatMessageStatus = 'streaming' | 'done' | 'error';

export interface ChatMessageView {
  id: string;
  role: ChatRole;
  text: string;
  /** Base64 data URLs attached to a user message. */
  images: string[];
  status: ChatMessageStatus;
  error?: string;
}

/** Wire shape for one turn of `POST /chat/stream`. */
export interface ChatPayloadMessage {
  role: ChatRole;
  content: string;
  images?: string[];
}

export const MAX_ATTACHED_IMAGES = 4;

/** Completed turns only — streaming placeholders and failed responses never
 * replay to the server. */
export function toChatPayload(messages: ChatMessageView[]): ChatPayloadMessage[] {
  return messages
    .filter((m) => m.status === 'done' && (m.text.trim().length > 0 || m.images.length > 0))
    .map((m) =>
      m.role === 'user' && m.images.length > 0
        ? { role: m.role, content: m.text, images: m.images }
        : { role: m.role, content: m.text },
    );
}

/** Everything strictly before the message `id`, or null when it isn't in the
 * thread. Editing/undoing a user message rewinds the thread to this point. */
export function truncateBefore(
  messages: ChatMessageView[],
  id: string,
): ChatMessageView[] | null {
  const index = messages.findIndex((m) => m.id === id);
  return index === -1 ? null : messages.slice(0, index);
}

/** The most recent user message — the anchor of the last exchange. */
export function lastUserMessage(messages: ChatMessageView[]): ChatMessageView | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i].role === 'user') {
      return messages[i];
    }
  }
  return null;
}

/** The thread up to and including its last user message — what a regenerate
 * replays after dropping the failed/unwanted assistant reply. */
export function historyForRegenerate(messages: ChatMessageView[]): ChatMessageView[] | null {
  const last = lastUserMessage(messages);
  if (!last) {
    return null;
  }
  return messages.slice(0, messages.indexOf(last) + 1);
}

/** A thread loaded from disk can contain a placeholder that was streaming when
 * the app died — surface it as an error instead of an eternal spinner. */
export function settleInterrupted(messages: ChatMessageView[]): ChatMessageView[] {
  return messages.map((m) =>
    m.status === 'streaming'
      ? { ...m, status: 'error' as const, error: 'Interrupted — tap to retry.' }
      : m,
  );
}
