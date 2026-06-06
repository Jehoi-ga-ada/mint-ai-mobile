import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ChatMessageView } from './chatModel';

const CHAT_KEY = 'mint-ai-chat';

/** The chat thread persists so a conversation survives an app restart.
 * Failures degrade to an empty thread rather than crashing (mirrors money
 * storage). */
export async function loadChat(): Promise<ChatMessageView[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CHAT_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ChatMessageView[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveChat(messages: ChatMessageView[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  } catch {
    // Best-effort: an unwritable store still works in-memory for this session.
  }
}
