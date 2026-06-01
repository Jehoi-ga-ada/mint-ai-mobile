/**
 * Mint AI — personal finance & portfolio tracker.
 *
 * @format
 */

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CACHE_BUSTER, CACHE_MAX_AGE, queryPersister } from './src/offline/persister';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      // Retain cached data long enough for the persister to restore it offline.
      gcTime: CACHE_MAX_AGE,
    },
  },
});

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: CACHE_MAX_AGE,
        buster: CACHE_BUSTER,
      }}
    >
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <RootNavigator />
      </SafeAreaProvider>
    </PersistQueryClientProvider>
  );
}

export default App;
