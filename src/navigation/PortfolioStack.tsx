import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AddInvestmentScreen } from '../features/portfolio/AddInvestmentScreen';
import { CreatePortfolioScreen } from '../features/portfolio/CreatePortfolioScreen';
import { PortfolioDetailScreen } from '../features/portfolio/PortfolioDetailScreen';
import { PortfolioListScreen } from '../features/portfolio/PortfolioListScreen';
import { PortfolioTransactionsScreen } from '../features/portfolio/PortfolioTransactionsScreen';
import { colors } from '../theme';
import type { PortfolioStackParamList } from './types';

const Stack = createNativeStackNavigator<PortfolioStackParamList>();

export function PortfolioStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="PortfolioList"
        component={PortfolioListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="PortfolioDetail" component={PortfolioDetailScreen} options={{ title: '' }} />
      <Stack.Screen
        name="PortfolioTransactions"
        component={PortfolioTransactionsScreen}
        options={{ title: 'Transactions' }}
      />
      <Stack.Screen
        name="AddInvestment"
        component={AddInvestmentScreen}
        options={{ title: 'Add investment', presentation: 'modal' }}
      />
      <Stack.Screen
        name="CreatePortfolio"
        component={CreatePortfolioScreen}
        options={{ title: 'New portfolio', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
