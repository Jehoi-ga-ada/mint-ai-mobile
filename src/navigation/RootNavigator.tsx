import {
  DarkTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { useEffect } from 'react';

import { LoadingView } from '../components/StateView';
import { OfflineBanner } from '../components/OfflineBanner';
import { Screen } from '../components/Screen';
import { useSync } from '../offline/useSync';
import { useAuthStore } from '../store/authStore';
import { usePrefsStore } from '../store/prefsStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors } from '../theme';
import { AppTabs } from './AppTabs';
import { AuthStack } from './AuthStack';

const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydratePrefs = usePrefsStore((s) => s.hydrate);

  // Hydrate the offline queue, wire connectivity, and flush queued writes.
  useSync();

  useEffect(() => {
    hydrate();
    hydrateSettings();
    hydratePrefs();
  }, [hydrate, hydrateSettings, hydratePrefs]);

  if (status === 'loading') {
    return (
      <Screen>
        <LoadingView />
      </Screen>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      {status === 'authed' ? (
        <>
          <AppTabs />
          <OfflineBanner />
        </>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
