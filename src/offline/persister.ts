import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/** Persists the React Query cache to disk so previously-loaded data (balances,
 * stats, ledger, reference data) is viewable offline and survives a restart.
 * `buster` invalidates the persisted cache when the shape changes. */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'mint-ai-rq-cache',
  throttleTime: 1000,
});

/** Drop persisted cache older than this; stale prices/balances beyond a week
 * aren't worth showing offline. */
export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;
export const CACHE_BUSTER = 'v1';
