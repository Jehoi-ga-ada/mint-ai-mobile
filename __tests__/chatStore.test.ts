import type { StreamCallbacks } from '../src/api/sse';
import { useChatStore } from '../src/features/assistant/chatStore';

jest.mock('@react-native-async-storage/async-storage', () => {
  let store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      setItem: jest.fn(async (k: string, v: string) => {
        store[k] = v;
      }),
      getItem: jest.fn(async (k: string) => (k in store ? store[k] : null)),
      removeItem: jest.fn(async (k: string) => {
        delete store[k];
      }),
      clear: jest.fn(async () => {
        store = {};
      }),
    },
  };
});

// Capture each stream request so tests can drive tokens/done/error by hand.
const mockStreamCalls: Array<{ body: { messages: Array<{ role: string; content: string }> }; cb: StreamCallbacks }> = [];
const mockAbortSpy = jest.fn();

jest.mock('../src/api/sse', () => ({
  streamChat: jest.fn((body: unknown, _token: string | null, cb: StreamCallbacks) => {
    mockStreamCalls.push({ body: body as { messages: Array<{ role: string; content: string }> }, cb });
    return mockAbortSpy;
  }),
}));

jest.mock('../src/store/authStore', () => ({
  useAuthStore: {
    getState: () => ({ token: 'test-token', status: 'authed', signOut: jest.fn() }),
  },
}));

function lastCall() {
  return mockStreamCalls[mockStreamCalls.length - 1];
}

beforeEach(() => {
  mockStreamCalls.length = 0;
  mockAbortSpy.mockClear();
  useChatStore.setState({ messages: [], isStreaming: false, editingId: null, hydrated: true });
});

describe('chatStore send', () => {
  test('appends the user message and a streaming placeholder, then settles on done', () => {
    // Arrange + Act
    useChatStore.getState().send('hello there', []);

    // Assert — streaming placeholder is live
    const during = useChatStore.getState();
    expect(during.isStreaming).toBe(true);
    expect(during.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(lastCall().body.messages).toEqual([{ role: 'user', content: 'hello there' }]);

    // Act — tokens arrive and the stream completes
    lastCall().cb.onToken('Hi ');
    lastCall().cb.onToken('back');
    lastCall().cb.onDone();

    const after = useChatStore.getState();
    expect(after.isStreaming).toBe(false);
    expect(after.messages[1]).toMatchObject({ text: 'Hi back', status: 'done' });
  });

  test('ignores empty sends and sends while streaming', () => {
    useChatStore.getState().send('   ', []);
    expect(mockStreamCalls).toHaveLength(0);

    useChatStore.getState().send('first', []);
    useChatStore.getState().send('second while busy', []);
    expect(mockStreamCalls).toHaveLength(1);
  });

  test('marks the reply as an error when the stream fails', () => {
    useChatStore.getState().send('hello', []);

    lastCall().cb.onError('server exploded');

    const reply = useChatStore.getState().messages[1];
    expect(reply.status).toBe('error');
    expect(reply.error).toBe('server exploded');
    expect(useChatStore.getState().isStreaming).toBe(false);
  });
});

describe('chatStore edit', () => {
  test('editing a user message rewinds the thread and replays from there', () => {
    useChatStore.getState().send('original question', []);
    lastCall().cb.onToken('first answer');
    lastCall().cb.onDone();
    const userId = useChatStore.getState().messages[0].id;

    const target = useChatStore.getState().startEdit(userId);
    expect(target?.text).toBe('original question');

    useChatStore.getState().send('better question', []);

    const messages = useChatStore.getState().messages;
    expect(messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(messages[0].text).toBe('better question');
    expect(lastCall().body.messages).toEqual([{ role: 'user', content: 'better question' }]);
  });

  test('startEdit refuses non-user messages', () => {
    useChatStore.getState().send('q', []);
    lastCall().cb.onToken('a');
    lastCall().cb.onDone();
    const assistantId = useChatStore.getState().messages[1].id;

    expect(useChatStore.getState().startEdit(assistantId)).toBeNull();
  });
});

describe('chatStore undo', () => {
  test('undoLast removes the last exchange and returns the message for refill', () => {
    useChatStore.getState().send('keep me', []);
    lastCall().cb.onToken('kept answer');
    lastCall().cb.onDone();
    useChatStore.getState().send('undo me', []);
    lastCall().cb.onToken('discarded answer');
    lastCall().cb.onDone();

    const removed = useChatStore.getState().undoLast();

    expect(removed?.text).toBe('undo me');
    expect(useChatStore.getState().messages.map((m) => m.text)).toEqual([
      'keep me',
      'kept answer',
    ]);
  });

  test('undo is refused while streaming', () => {
    useChatStore.getState().send('busy', []);

    expect(useChatStore.getState().undoLast()).toBeNull();
    expect(useChatStore.getState().messages).toHaveLength(2);
  });
});

describe('chatStore stop and regenerate', () => {
  test('stop aborts and keeps the partial reply', () => {
    useChatStore.getState().send('long question', []);
    lastCall().cb.onToken('partial ans');

    useChatStore.getState().stop();

    expect(mockAbortSpy).toHaveBeenCalled();
    expect(useChatStore.getState().messages[1]).toMatchObject({
      text: 'partial ans',
      status: 'done',
    });
  });

  test('stop drops an empty placeholder entirely', () => {
    useChatStore.getState().send('question', []);

    useChatStore.getState().stop();

    expect(useChatStore.getState().messages.map((m) => m.role)).toEqual(['user']);
  });

  test('regenerate replays history through the last user message', () => {
    useChatStore.getState().send('question', []);
    lastCall().cb.onError('flaky network');

    useChatStore.getState().regenerate();

    expect(mockStreamCalls).toHaveLength(2);
    expect(lastCall().body.messages).toEqual([{ role: 'user', content: 'question' }]);
    const messages = useChatStore.getState().messages;
    expect(messages.filter((m) => m.role === 'assistant')).toHaveLength(1);
    expect(messages[1].status).toBe('streaming');
  });
});
