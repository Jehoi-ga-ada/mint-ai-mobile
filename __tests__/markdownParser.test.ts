import { parseInline, parseMarkdown } from '../src/features/assistant/markdownParser';

describe('parseInline', () => {
  test('parses bold spans', () => {
    expect(parseInline('a **bold** word')).toEqual([
      { text: 'a ' },
      { text: 'bold', bold: true },
      { text: ' word' },
    ]);
  });

  test('parses italic, code, and links', () => {
    expect(parseInline('*it* `code` [src](https://x.io)')).toEqual([
      { text: 'it', italic: true },
      { text: ' ' },
      { text: 'code', code: true },
      { text: ' ' },
      { text: 'src', href: 'https://x.io' },
    ]);
  });

  test('bold wins over italic when overlapping (earliest match)', () => {
    expect(parseInline('**Investor Shift:** moved')).toEqual([
      { text: 'Investor Shift:', bold: true },
      { text: ' moved' },
    ]);
  });

  test('unmatched markers stay literal', () => {
    expect(parseInline('2 ** 3 is unclear')).toEqual([{ text: '2 ** 3 is unclear' }]);
  });
});

describe('parseMarkdown', () => {
  test('groups consecutive lines into one paragraph', () => {
    const blocks = parseMarkdown('line one\nline two\n\nsecond para');

    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ kind: 'paragraph' });
    expect(blocks[1]).toMatchObject({ kind: 'paragraph' });
  });

  test('parses bullets with markers and nesting depth', () => {
    const blocks = parseMarkdown('* top\n  * nested\n1. numbered');

    expect(blocks[0]).toMatchObject({ kind: 'bullet', depth: 0, marker: '•' });
    expect(blocks[1]).toMatchObject({ kind: 'bullet', depth: 1, marker: '•' });
    expect(blocks[2]).toMatchObject({ kind: 'bullet', depth: 0, marker: '1.' });
  });

  test('parses headings by level', () => {
    const blocks = parseMarkdown('# One\n## Two\n### Three');

    expect(blocks.map((b) => (b.kind === 'heading' ? b.level : null))).toEqual([1, 2, 3]);
  });

  test('parses fenced code blocks', () => {
    const blocks = parseMarkdown('before\n```\nconst x = 1;\n```\nafter');

    expect(blocks[1]).toEqual({ kind: 'code', text: 'const x = 1;' });
  });

  test('keeps an unterminated fence visible mid-stream', () => {
    const blocks = parseMarkdown('```\npartial code');

    expect(blocks[0]).toEqual({ kind: 'code', text: 'partial code' });
  });

  test('parses the shape Gemini actually emits', () => {
    const sample =
      'Bitcoin had a rough week:\n\n*   **ETF Outflows:** $2.3 billion withdrawn (Yahoo Finance).\n*   **MicroStrategy Sale:** sold 32 bitcoins.';
    const blocks = parseMarkdown(sample);

    expect(blocks[0]).toMatchObject({ kind: 'paragraph' });
    expect(blocks[1]).toMatchObject({ kind: 'bullet' });
    const bullet = blocks[1];
    expect(bullet.kind === 'bullet' && bullet.spans[0]).toEqual({
      text: 'ETF Outflows:',
      bold: true,
    });
  });
});
