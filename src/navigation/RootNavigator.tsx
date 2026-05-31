import {
  DarkTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { useEffect } from 'react';

import { LoadingView } from '../components/StateView';
import { Screen } from '../components/Screen';
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
      {status === 'authed' ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
