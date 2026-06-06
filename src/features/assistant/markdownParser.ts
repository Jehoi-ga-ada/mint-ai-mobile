/** Minimal markdown parser for assistant replies — the subset Gemini actually
 * emits (bold/italic/inline code, bullets, numbered lists, headings, code
 * fences, links). Pure so it is unit-testable; unmatched syntax degrades to
 * literal text, which keeps mid-stream partial markdown harmless. */

export interface InlineSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  href?: string;
}

export type MdBlock =
  | { kind: 'paragraph'; spans: InlineSpan[] }
  | { kind: 'heading'; level: 1 | 2 | 3; spans: InlineSpan[] }
  | { kind: 'bullet'; depth: number; marker: string; spans: InlineSpan[] }
  | { kind: 'code'; text: string };

const BOLD = /\*\*(.+?)\*\*/;
const ITALIC = /\*([^*\n]+)\*/;
const CODE = /`([^`\n]+)`/;
const LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/;
const HEADING = /^(#{1,3})\s+(.*)$/;
const LIST_ITEM = /^(\s*)([*+-]|\d+\.)\s+(.*)$/;
const INDENT_PER_DEPTH = 2;

/** Tokenize inline syntax by always consuming the earliest match. */
export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  let rest = text;

  while (rest.length > 0) {
    const candidates = [
      { match: BOLD.exec(rest), make: (m: RegExpExecArray): InlineSpan => ({ text: m[1], bold: true }) },
      { match: LINK.exec(rest), make: (m: RegExpExecArray): InlineSpan => ({ text: m[1], href: m[2] }) },
      { match: CODE.exec(rest), make: (m: RegExpExecArray): InlineSpan => ({ text: m[1], code: true }) },
      { match: ITALIC.exec(rest), make: (m: RegExpExecArray): InlineSpan => ({ text: m[1], italic: true }) },
    ].filter((c): c is { match: RegExpExecArray; make: (m: RegExpExecArray) => InlineSpan } => c.match !== null);

    if (candidates.length === 0) {
      spans.push({ text: rest });
      break;
    }

    const first = candidates.reduce((a, b) => (b.match.index < a.match.index ? b : a));
    if (first.match.index > 0) {
      spans.push({ text: rest.slice(0, first.match.index) });
    }
    spans.push(first.make(first.match));
    rest = rest.slice(first.match.index + first.match[0].length);
  }

  return spans;
}

export function parseMarkdown(text: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  let paragraph: string[] = [];
  let codeLines: string[] | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ kind: 'paragraph', spans: parseInline(paragraph.join(' ')) });
      paragraph = [];
    }
  };

  for (const line of text.split('\n')) {
    if (codeLines !== null) {
      if (line.trim().startsWith('```')) {
        blocks.push({ kind: 'code', text: codeLines.join('\n') });
        codeLines = null;
      } else {
        codeLines.push(line);
      }
      continue;
    }
    if (line.trim().startsWith('```')) {
      flushParagraph();
      codeLines = [];
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({
        kind: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        spans: parseInline(heading[2]),
      });
      continue;
    }

    const item = LIST_ITEM.exec(line);
    if (item) {
      flushParagraph();
      blocks.push({
        kind: 'bullet',
        depth: Math.min(Math.floor(item[1].length / INDENT_PER_DEPTH), 3),
        marker: /\d/.test(item[2]) ? item[2] : '•',
        spans: parseInline(item[3]),
      });
      continue;
    }

    if (line.trim().length === 0) {
      flushParagraph();
    } else {
      paragraph.push(line.trim());
    }
  }

  // Unterminated fence mid-stream — render what arrived so far.
  if (codeLines !== null && codeLines.length > 0) {
    blocks.push({ kind: 'code', text: codeLines.join('\n') });
  }
  flushParagraph();

  return blocks;
}
