import { useMemo } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../../theme';
import { type InlineSpan, type MdBlock, parseMarkdown } from './markdownParser';

const BULLET_INDENT = 14;

function Spans({ spans }: { spans: InlineSpan[] }) {
  return (
    <>
      {spans.map((span, index) => (
        <Text
          key={index}
          style={[
            span.bold && styles.bold,
            span.italic && styles.italic,
            span.code && styles.inlineCode,
            span.href != null && styles.link,
          ]}
          onPress={span.href != null ? () => Linking.openURL(span.href as string) : undefined}
        >
          {span.text}
        </Text>
      ))}
    </>
  );
}

function Block({ block }: { block: MdBlock }) {
  switch (block.kind) {
    case 'heading':
      return (
        <Text style={[styles.base, block.level === 1 ? styles.h1 : block.level === 2 ? styles.h2 : styles.h3]}>
          <Spans spans={block.spans} />
        </Text>
      );
    case 'bullet':
      return (
        <View style={[styles.bulletRow, { paddingLeft: block.depth * BULLET_INDENT }]}>
          <Text style={[styles.base, styles.marker]}>{block.marker}</Text>
          <Text style={[styles.base, styles.bulletText]}>
            <Spans spans={block.spans} />
          </Text>
        </View>
      );
    case 'code':
      return (
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>{block.text}</Text>
        </View>
      );
    default:
      return (
        <Text style={styles.base}>
          <Spans spans={block.spans} />
        </Text>
      );
  }
}

/** Renders assistant markdown (bold/lists/headings/code/links) as native Text. */
export function MarkdownText({ text }: { text: string }) {
  const blocks = useMemo(() => parseMarkdown(text), [text]);
  return (
    <View style={styles.container}>
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  base: { ...typography.body, color: colors.text, lineHeight: 21 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  inlineCode: {
    fontFamily: 'Menlo',
    fontSize: 13,
    backgroundColor: colors.surface,
    color: colors.primary,
  },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  h1: { ...typography.title, lineHeight: 28 },
  h2: { ...typography.heading, fontSize: 19, lineHeight: 25 },
  h3: { ...typography.heading, lineHeight: 23 },
  bulletRow: { flexDirection: 'row', gap: spacing.sm },
  marker: { color: colors.textMuted, minWidth: 14 },
  bulletText: { flex: 1 },
  codeBlock: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  codeText: { fontFamily: 'Menlo', fontSize: 13, color: colors.text, lineHeight: 18 },
});
