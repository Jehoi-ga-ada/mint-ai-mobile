import {
  DarkTheme,
  NavigationContainer,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { OfflineBanner } from '../components/OfflineBanner';
import { SplashScreen } from '../components/SplashScreen';
import { LoginScreen } from '../features/auth/LoginScreen';
import { RegisterScreen } from '../features/auth/RegisterScreen';
import { useMoneyBackupSync } from '../money/backupSync';
import { useMoneyStore } from '../money/moneyStore';
import { useConnectivity } from '../offline/useConnectivity';
import { useAuthStore } from '../store/authStore';
import { usePrefsStore } from '../store/prefsStore';
import { useSettingsStore } from '../store/settingsStore';
import { colors } from '../theme';
import { AppTabs } from './AppTabs';
import type { RootStackParamList } from './types';

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

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydratePrefs = usePrefsStore((s) => s.hydrate);
  const hydrateMoney = useMoneyStore((s) => s.hydrate);
  const moneyHydrated = useMoneyStore((s) => s.hydrated);
  const [splashDone, setSplashDone] = useState(false);

  // Reflect connectivity into React Query + the network store (Portfolio needs it).
  useConnectivity();
  // Snapshot-backup the local Money state whenever signed in + online.
  useMoneyBackupSync();

  useEffect(() => {
    hydrateAuth();
    hydrateSettings();
    hydratePrefs();
    hydrateMoney();
  }, [hydrateAuth, hydrateSettings, hydratePrefs, hydrateMoney]);

  // The app renders immediately under an animated splash; the splash fades out
  // once auth + the local Money store are hydrated (and after a brief minimum).
  const ready = status !== 'loading' && moneyHydrated;

  return (
    <View style={styles.root}>
      <NavigationContainer theme={navTheme}>
        <RootStack.Navigator>
          <RootStack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
          {/* Auth is optional and presented over the always-on tabs. */}
          <RootStack.Group screenOptions={{ presentation: 'modal', headerShown: false }}>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Register" component={RegisterScreen} />
          </RootStack.Group>
        </RootStack.Navigator>
        <OfflineBanner />
      </NavigationContainer>
      {/* Splash overlays everything; sits outside the navigator so it always
          paints on top regardless of navigator internals. */}
      {!splashDone && <SplashScreen ready={ready} onFinish={() => setSplashDone(true)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
