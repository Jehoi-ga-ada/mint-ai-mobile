import { API_BASE_URL } from '../config';

/** One parsed SSE data frame from the chat stream. */
export interface SseEvent {
  content?: string;
  error?: string;
  /** Tool-activity marker (e.g. a web search starting). */
  status?: string;
}

export interface SseParseResult {
  events: SseEvent[];
  done: boolean;
  nextIndex: number;
}

const DATA_PREFIX = 'data: ';
const DONE_SENTINEL = '[DONE]';
const STREAM_TIMEOUT_MS = 120_000;

/** Pull complete `data: ...\n\n` frames out of an SSE buffer starting at
 * `from`. Pure so the cursor logic is unit-testable; callers keep feeding the
 * growing XHR responseText plus the returned cursor. */
export function parseSseBuffer(buffer: string, from: number): SseParseResult {
  const events: SseEvent[] = [];
  let done = false;
  let cursor = from;

  for (;;) {
    const frameEnd = buffer.indexOf('\n\n', cursor);
    if (frameEnd === -1) {
      break;
    }
    const frame = buffer.slice(cursor, frameEnd);
    cursor = frameEnd + 2;

    for (const line of frame.split('\n')) {
      if (!line.startsWith(DATA_PREFIX)) {
        continue;
      }
      const payload = line.slice(DATA_PREFIX.length);
      if (payload === DONE_SENTINEL) {
        done = true;
        continue;
      }
      try {
        const parsed: unknown = JSON.parse(payload);
        if (parsed && typeof parsed === 'object') {
          events.push(parsed as SseEvent);
        }
      } catch {
        // Malformed frame — skip it rather than killing the stream.
      }
    }
  }

  return { events, done, nextIndex: cursor };
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (message: string, status?: number) => void;
  /** Tool activity started server-side (worth showing as a status line). */
  onStatus?: (status: string) => void;
}

function extractDetail(responseText: string): string | null {
  try {
    const body: unknown = JSON.parse(responseText);
    if (body && typeof body === 'object') {
      const detail = (body as { detail?: unknown }).detail;
      if (typeof detail === 'string') {
        return detail;
      }
    }
  } catch {
    // Non-JSON error body.
  }
  return null;
}

/** POST the chat request and stream SSE tokens back. RN's fetch cannot stream
 * response bodies, but XHR fires progress events with the partial text, so we
 * parse frames incrementally from responseText. Returns an abort function. */
export function streamChat(body: unknown, token: string | null, cb: StreamCallbacks): () => void {
  const xhr = new XMLHttpRequest();
  let cursor = 0;
  let settled = false;

  const settle = (fn: () => void) => {
    if (!settled) {
      settled = true;
      fn();
    }
  };

  const pump = (): boolean => {
    const { events, done, nextIndex } = parseSseBuffer(xhr.responseText ?? '', cursor);
    cursor = nextIndex;
    for (const event of events) {
      if (typeof event.error === 'string') {
        settle(() => cb.onError(event.error as string));
        return true;
      }
      if (typeof event.content === 'string') {
        cb.onToken(event.content);
      }
      if (typeof event.status === 'string') {
        cb.onStatus?.(event.status);
      }
    }
    return done;
  };

  xhr.open('POST', `${API_BASE_URL}/chat/stream`);
  xhr.timeout = STREAM_TIMEOUT_MS;
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Accept', 'text/event-stream');
  if (token) {
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
  }

  xhr.onreadystatechange = () => {
    if (settled) {
      return;
    }
    if (xhr.readyState === XMLHttpRequest.LOADING && xhr.status === 200) {
      pump();
    } else if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        pump();
        settle(cb.onDone);
      } else {
        const detail = extractDetail(xhr.responseText ?? '');
        const fallback = xhr.status > 0 ? `Request failed (${xhr.status})` : 'Network error';
        settle(() => cb.onError(detail ?? fallback, xhr.status || undefined));
      }
    }
  };
  xhr.ontimeout = () => settle(() => cb.onError('The assistant took too long to respond.'));
  xhr.onerror = () => settle(() => cb.onError('Network error'));

  xhr.send(JSON.stringify(body));

  return () => {
    settled = true;
    xhr.abort();
  };
}
