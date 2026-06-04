import { StyleSheet, Text, View } from 'react-native';

import { AuthGate } from '../../components/AuthGate';
import { Icon } from '../../components/Icon';
import { Screen } from '../../components/Screen';
import { colors, radius, spacing, typography } from '../../theme';

/** The AI assistant is gated behind sign-in (it runs against the server). The
 * chat UI is not built yet — this reserves the entry point and explains it. */
export function AssistantScreen() {
  return (
    <AuthGate reason="The AI assistant analyzes your portfolio on the server, so it needs an account.">
      <Screen>
        <View style={styles.body}>
          <View style={styles.badge}>
            <Icon name="sparkles" color={colors.primary} size={30} />
          </View>
          <Text style={styles.title}>Assistant</Text>
          <Text style={styles.subtitle}>
            Chat with your AI finance assistant is coming soon.
          </Text>
        </View>
      </Screen>
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, color: colors.text },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
