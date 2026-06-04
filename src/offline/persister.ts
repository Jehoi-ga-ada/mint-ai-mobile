import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

/** Persists the React Query cache to disk so previously-loaded Portfolio data
 * (holdings, prices, history) is viewable offline and survives a restart.
 * `buster` invalidates the persisted cache when the shape changes. */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'mint-ai-rq-cache',
  throttleTime: 1000,
});

/** Drop persisted cache older than this; stale prices/balances beyond a week
 * aren't worth showing offline. */
export const CACHE_MAX_AGE = 1000 * 60 * 60 * 24 * 7;
// v2: money moved off the server into the local store; only Portfolio/asset
// queries are server-backed now, so the old persisted money cache is dropped.
export const CACHE_BUSTER = 'v2';

/** Only Portfolio/asset queries are worth persisting — Money is local-first and
 * has no server queries. Keeps transient auth/import responses out of the cache. */
const PERSISTED_QUERY_PREFIXES = ['portfolios', 'portfolio', 'assets', 'assetPrice'];

export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  const head = queryKey[0];
  return typeof head === 'string' && PERSISTED_QUERY_PREFIXES.includes(head);
}
