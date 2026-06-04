import type { ReactNode } from 'react';
import {
  type Edge,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Rendered outside the scroll area so it stays fixed (e.g. a FAB). */
  fab?: ReactNode;
  /** Set on screens that sit under a native stack header (avoids a double top inset). */
  header?: boolean;
}

const WITH_HEADER_EDGES: Edge[] = ['left', 'right'];
const FULL_EDGES: Edge[] = ['top', 'left', 'right'];

export function Screen({ children, scroll, refreshing, onRefresh, fab, header }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={header ? WITH_HEADER_EDGES : FULL_EDGES}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          // Inset the scroll content for the keyboard so focused fields and the
          // controls below them are never hidden behind it (iOS).
          automaticallyAdjustKeyboardInsets
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={!!refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.flex]}>{children}</View>
      )}
      {fab}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg },
});
