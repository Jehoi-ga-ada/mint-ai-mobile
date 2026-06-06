import uuid from 'react-native-uuid';
import { create } from 'zustand';

import { streamChat } from '../../api/sse';
import { useMoneyStore } from '../../money/moneyStore';
import { useAuthStore } from '../../store/authStore';
import { buildMoneyContext } from './moneyContext';
import {
  type ChatMessageView,
  historyForRegenerate,
  lastUserMessage,
  settleInterrupted,
  toChatPayload,
  truncateBefore,
} from './chatModel';
import { loadChat, saveChat } from './chatStorage';

function newId(): string {
  return uuid.v4() as string;
}

/** Abort handle for the in-flight stream. Lives outside the store — it is not
 * serializable state, just a side-channel to the XHR. */
let abortStream: (() => void) | null = null;

interface ChatStore {
  messages: ChatMessageView[];
  isStreaming: boolean;
  /** User message being edited; send() rewinds the thread to it. */
  editingId: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  send: (text: string, images: string[]) => void;
  stop: () => void;
  /** Drop the trailing assistant reply and stream a fresh one. */
  regenerate: () => void;
  startEdit: (id: string) => ChatMessageView | null;
  cancelEdit: () => void;
  /** Remove the last user message and everything after it; returns the removed
   * message so the composer can be refilled (a true undo of sending). */
  undoLast: () => ChatMessageView | null;
  /** Same as undoLast but anchored at a specific user message. */
  undoFrom: (id: string) => ChatMessageView | null;
  clear: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => {
  /** Append a streaming placeholder after `history` and pump tokens into it. */
  const startStream = (history: ChatMessageView[]) => {
    const placeholder: ChatMessageView = {
      id: newId(),
      role: 'assistant',
      text: '',
      images: [],
      status: 'streaming',
    };
    set({ messages: [...history, placeholder], isStreaming: true, editingId: null });
    saveChat(history); // placeholders never persist — they settle or error first

    const finish = (mutate: (m: ChatMessageView) => ChatMessageView | null) => {
      abortStream = null;
      const messages = get()
        .messages.map((m) => (m.id === placeholder.id ? mutate(m) : m))
        .filter((m): m is ChatMessageView => m !== null);
      set({ messages, isStreaming: false });
      saveChat(messages);
    };

    abortStream = streamChat(
      {
        messages: toChatPayload(history),
        // Money data lives on-device only; ship a compact summary so the
        // assistant can answer spending/balance questions.
        money_context: buildMoneyContext(useMoneyStore.getState()),
      },
      useAuthStore.getState().token,
      {
        onToken: (token) =>
          set({
            messages: get().messages.map((m) =>
              m.id === placeholder.id ? { ...m, text: m.text + token } : m,
            ),
          }),
        onStatus: (status) => {
          // The server sends the tool name; phrase it as user-facing activity.
          const note = status.includes('portfolio') || status.includes('transactions')
            ? 'Checking your data…'
            : 'Searching the web…';
          set({
            messages: get().messages.map((m) =>
              m.id === placeholder.id && m.text.length === 0 ? { ...m, note } : m,
            ),
          });
        },
        onDone: () =>
          finish((m) =>
            m.text.trim().length > 0
              ? { ...m, status: 'done' }
              : { ...m, status: 'error', error: 'The assistant sent no response.' },
          ),
        onError: (message, status) => {
          if (status === 401 && useAuthStore.getState().status === 'authed') {
            useAuthStore.getState().signOut();
          }
          finish((m) => ({ ...m, status: 'error', error: message }));
        },
      },
    );
  };

  return {
    messages: [],
    isStreaming: false,
    editingId: null,
    hydrated: false,

    hydrate: async () => {
      const persisted = await loadChat();
      set({ messages: settleInterrupted(persisted ?? []), hydrated: true });
    },

    send: (text, images) => {
      const trimmed = text.trim();
      if (get().isStreaming || (trimmed.length === 0 && images.length === 0)) {
        return;
      }
      const { editingId } = get();
      const base = editingId
        ? (truncateBefore(get().messages, editingId) ?? get().messages)
        : get().messages;
      const userMessage: ChatMessageView = {
        id: newId(),
        role: 'user',
        text: trimmed,
        images,
        status: 'done',
      };
      startStream([...base, userMessage]);
    },

    stop: () => {
      if (!get().isStreaming) {
        return;
      }
      abortStream?.();
      abortStream = null;
      // Keep whatever streamed in; an empty placeholder just disappears.
      const messages = get()
        .messages.map((m) =>
          m.status !== 'streaming' ? m : m.text ? { ...m, status: 'done' as const } : null,
        )
        .filter((m): m is ChatMessageView => m !== null);
      set({ messages, isStreaming: false });
      saveChat(messages);
    },

    regenerate: () => {
      if (get().isStreaming) {
        return;
      }
      const history = historyForRegenerate(get().messages);
      if (history) {
        startStream(history);
      }
    },

    startEdit: (id) => {
      if (get().isStreaming) {
        return null;
      }
      const target = get().messages.find((m) => m.id === id && m.role === 'user') ?? null;
      if (target) {
        set({ editingId: id });
      }
      return target;
    },

    cancelEdit: () => set({ editingId: null }),

    undoFrom: (id) => {
      if (get().isStreaming) {
        return null;
      }
      const target = get().messages.find((m) => m.id === id && m.role === 'user') ?? null;
      const truncated = target ? truncateBefore(get().messages, id) : null;
      if (!target || truncated === null) {
        return null;
      }
      set({ messages: truncated, editingId: null });
      saveChat(truncated);
      return target;
    },

    undoLast: () => {
      const last = lastUserMessage(get().messages);
      return last ? get().undoFrom(last.id) : null;
    },

    clear: () => {
      if (get().isStreaming) {
        abortStream?.();
        abortStream = null;
      }
      set({ messages: [], isStreaming: false, editingId: null });
      saveChat([]);
    },
  };
});
