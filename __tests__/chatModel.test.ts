import {
  type ChatMessageView,
  historyForRegenerate,
  lastUserMessage,
  settleInterrupted,
  toChatPayload,
  truncateBefore,
} from '../src/features/assistant/chatModel';

function msg(overrides: Partial<ChatMessageView> & Pick<ChatMessageView, 'id' | 'role'>): ChatMessageView {
  return { text: 'hello', images: [], status: 'done', ...overrides };
}

const THREAD: ChatMessageView[] = [
  msg({ id: 'u1', role: 'user', text: 'first question' }),
  msg({ id: 'a1', role: 'assistant', text: 'first answer' }),
  msg({ id: 'u2', role: 'user', text: 'second question' }),
  msg({ id: 'a2', role: 'assistant', text: 'second answer' }),
];

describe('toChatPayload', () => {
  test('maps completed turns and keeps images only on user messages that have them', () => {
    const withImage = [
      msg({ id: 'u1', role: 'user', text: 'see this', images: ['data:image/png;base64,xx'] }),
      msg({ id: 'a1', role: 'assistant', text: 'an answer' }),
    ];

    const payload = toChatPayload(withImage);

    expect(payload).toEqual([
      { role: 'user', content: 'see this', images: ['data:image/png;base64,xx'] },
      { role: 'assistant', content: 'an answer' },
    ]);
  });

  test('drops streaming placeholders and failed replies', () => {
    const thread = [
      msg({ id: 'u1', role: 'user' }),
      msg({ id: 'a1', role: 'assistant', text: '', status: 'error', error: 'boom' }),
      msg({ id: 'u2', role: 'user' }),
      msg({ id: 'a2', role: 'assistant', text: 'part', status: 'streaming' }),
    ];

    const payload = toChatPayload(thread);

    expect(payload.map((m) => m.role)).toEqual(['user', 'user']);
  });
});

describe('truncateBefore', () => {
  test('returns the messages before the target (edit rewinds to it)', () => {
    const kept = truncateBefore(THREAD, 'u2');

    expect(kept?.map((m) => m.id)).toEqual(['u1', 'a1']);
  });

  test('returns null for an unknown id', () => {
    expect(truncateBefore(THREAD, 'nope')).toBeNull();
  });
});

describe('lastUserMessage', () => {
  test('finds the most recent user message', () => {
    expect(lastUserMessage(THREAD)?.id).toBe('u2');
  });

  test('returns null when the thread has no user messages', () => {
    expect(lastUserMessage([msg({ id: 'a1', role: 'assistant' })])).toBeNull();
  });
});

describe('historyForRegenerate', () => {
  test('keeps the thread through the last user message, dropping trailing replies', () => {
    const history = historyForRegenerate(THREAD);

    expect(history?.map((m) => m.id)).toEqual(['u1', 'a1', 'u2']);
  });

  test('returns null for an empty thread', () => {
    expect(historyForRegenerate([])).toBeNull();
  });
});

describe('settleInterrupted', () => {
  test('converts streaming placeholders into retryable errors', () => {
    const settled = settleInterrupted([
      msg({ id: 'u1', role: 'user' }),
      msg({ id: 'a1', role: 'assistant', text: 'part', status: 'streaming' }),
    ]);

    expect(settled[1].status).toBe('error');
    expect(settled[0].status).toBe('done');
  });
});
