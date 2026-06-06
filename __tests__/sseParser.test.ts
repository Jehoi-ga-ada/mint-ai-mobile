import { parseSseBuffer } from '../src/api/sse';

describe('parseSseBuffer', () => {
  test('parses complete data frames into events', () => {
    // Arrange
    const buffer = 'data: {"content":"Hel"}\n\ndata: {"content":"lo"}\n\n';

    // Act
    const result = parseSseBuffer(buffer, 0);

    // Assert
    expect(result.events).toEqual([{ content: 'Hel' }, { content: 'lo' }]);
    expect(result.done).toBe(false);
    expect(result.nextIndex).toBe(buffer.length);
  });

  test('leaves an incomplete trailing frame for the next call', () => {
    const buffer = 'data: {"content":"a"}\n\ndata: {"content":"b';

    const result = parseSseBuffer(buffer, 0);

    expect(result.events).toEqual([{ content: 'a' }]);
    expect(result.nextIndex).toBe('data: {"content":"a"}\n\n'.length);
  });

  test('resumes from the cursor without re-emitting earlier events', () => {
    const first = 'data: {"content":"a"}\n\n';
    const buffer = `${first}data: {"content":"b"}\n\n`;

    const result = parseSseBuffer(buffer, first.length);

    expect(result.events).toEqual([{ content: 'b' }]);
  });

  test('flags the [DONE] sentinel', () => {
    const result = parseSseBuffer('data: {"content":"x"}\n\ndata: [DONE]\n\n', 0);

    expect(result.events).toEqual([{ content: 'x' }]);
    expect(result.done).toBe(true);
  });

  test('passes through error events', () => {
    const result = parseSseBuffer('data: {"error":"model exploded"}\n\n', 0);

    expect(result.events).toEqual([{ error: 'model exploded' }]);
  });

  test('skips malformed frames instead of throwing', () => {
    const result = parseSseBuffer('data: not-json\n\ndata: {"content":"ok"}\n\n', 0);

    expect(result.events).toEqual([{ content: 'ok' }]);
  });
});
