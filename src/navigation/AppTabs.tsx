import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { Platform, StyleSheet } from 'react-native';

import { AssistantScreen } from '../features/assistant/AssistantScreen';
import { Icon, type IconName } from '../components/Icon';
import { colors } from '../theme';
import { MoneyStack } from './MoneyStack';
import { PortfolioStack } from './PortfolioStack';
import type { AppTabParamList } from './types';

/** iOS uses the native UITabBarController (a floating, Liquid-Glass bar on
 * iOS 26); Android keeps a custom JS tab bar matching the dark theme. */
export function AppTabs() {
  return Platform.OS === 'ios' ? <IOSTabs /> : <AndroidTabs />;
}

// -- iOS: native bottom tabs (floating) with SF Symbol icons ------------------

const NativeTab = createNativeBottomTabNavigator<AppTabParamList>();

function IOSTabs() {
  return (
    <NativeTab.Navigator screenOptions={{ tabBarActiveTintColor: colors.primary }}>
      <NativeTab.Screen
        name="Money"
        component={MoneyStack}
        options={{ title: 'Money', tabBarIcon: () => ({ type: 'sfSymbol', name: 'banknote.fill' }) }}
      />
      <NativeTab.Screen
        name="Portfolio"
        component={PortfolioStack}
        options={{
          title: 'Portfolio',
          tabBarIcon: () => ({ type: 'sfSymbol', name: 'chart.pie.fill' }),
        }}
      />
      <NativeTab.Screen
        name="Assistant"
        component={AssistantScreen}
        options={{ title: 'Assistant', tabBarIcon: () => ({ type: 'sfSymbol', name: 'sparkles' }) }}
      />
    </NativeTab.Navigator>
  );
}

// -- Android: custom JS tab bar -----------------------------------------------

const Tab = createBottomTabNavigator<AppTabParamList>();

const ICONS: Record<keyof AppTabParamList, IconName> = {
  Money: 'wallet',
  Portfolio: 'pieChart',
  Assistant: 'sparkles',
};

function tabIcon(name: keyof AppTabParamList) {
  return ({ color }: { color: string }) => <Icon name={ICONS[name]} color={color} size={22} />;
}

function AndroidTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarIcon: tabIcon(route.name),
      })}
    >
      <Tab.Screen name="Money" component={MoneyStack} />
      <Tab.Screen name="Portfolio" component={PortfolioStack} />
      <Tab.Screen name="Assistant" component={AssistantScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    height: 64,
    paddingTop: 8,
  },
});
