import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet } from 'react-native';

import { Icon, type IconName } from '../components/Icon';
import { colors } from '../theme';
import { MoneyStack } from './MoneyStack';
import { PortfolioStack } from './PortfolioStack';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

const ICONS: Record<keyof AppTabParamList, IconName> = {
  Money: 'wallet',
  Portfolio: 'pieChart',
};

function tabIcon(name: keyof AppTabParamList) {
  return ({ color }: { color: string }) => <Icon name={ICONS[name]} color={color} size={22} />;
}

export function AppTabs() {
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
