import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AccountsScreen } from '../features/accounts/AccountsScreen';
import { AddTransactionScreen } from '../features/money/AddTransactionScreen';
import { MoneyHomeScreen } from '../features/money/MoneyHomeScreen';
import { MoneyStatsScreen } from '../features/money/MoneyStatsScreen';
import { TransactionsScreen } from '../features/money/TransactionsScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { colors } from '../theme';
import type { MoneyStackParamList } from './types';

const Stack = createNativeStackNavigator<MoneyStackParamList>();

export function MoneyStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MoneyHome" component={MoneyHomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} options={{ title: 'Transactions' }} />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ title: 'Add transaction', presentation: 'modal' }}
      />
      <Stack.Screen name="MoneyStats" component={MoneyStatsScreen} options={{ title: 'Stats' }} />
      <Stack.Screen name="Accounts" component={AccountsScreen} options={{ title: 'Accounts' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
