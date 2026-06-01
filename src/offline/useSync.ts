import NetInfo from '@react-native-community/netinfo';
import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useNetworkStore } from '../store/networkStore';
import { useOutboxStore } from './outbox';
import { flushOutbox } from './sync';

/** Wires connectivity into the app:
 *  - mirrors NetInfo into React Query's onlineManager (so paused reads resume)
 *    and our networkStore (so the UI can show an offline state),
 *  - flushes the outbox on mount and whenever connectivity is regained.
 *
 * Mount once, high in the tree (RootNavigator). */
export function useSync(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Load the queue from disk, THEN flush — flushing before hydrate resolves
    // would read an empty in-memory queue and drain nothing.
    useOutboxStore
      .getState()
      .hydrate()
      .then(() => flushOutbox(queryClient));

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      const wasOnline = useNetworkStore.getState().isOnline;

      useNetworkStore.getState().setOnline(online);
      onlineManager.setOnline(online);

      // Reconnected — drain whatever queued while we were offline.
      if (online && !wasOnline) {
        flushOutbox(queryClient);
      }
    });

    // Retry when the app returns to the foreground — covers the case where the
    // server was unreachable while the app stayed open (no connectivity change
    // fires, so we lean on this alongside the post-hydrate startup flush).
    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        flushOutbox(queryClient);
      }
    });

    return () => {
      unsubscribe();
      appStateSub.remove();
    };
  }, [queryClient]);
}
