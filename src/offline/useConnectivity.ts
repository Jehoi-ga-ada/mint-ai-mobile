import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useNetworkStore } from '../store/networkStore';

/** Wires device connectivity into the app:
 *  - mirrors NetInfo into React Query's `onlineManager` (so paused Portfolio
 *    reads resume on reconnect) and into our `networkStore` (so the UI can show
 *    an offline state / banner).
 *
 * The Money domain is fully local and never touches the network, so there is no
 * queue to flush — this hook is purely about reflecting connectivity. Mount once,
 * high in the tree (RootNavigator). */
export function useConnectivity(): void {
  useEffect(() => {
    const apply = (online: boolean) => {
      useNetworkStore.getState().setOnline(online);
      onlineManager.setOnline(online);
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      apply(state.isConnected === true && state.isInternetReachable !== false);
    });

    // On foreground, re-check connectivity (no event fires if the network never
    // changed while the app was backgrounded but the server became reachable).
    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        NetInfo.refresh();
      }
    });

    return () => {
      unsubscribe();
      appStateSub.remove();
    };
  }, []);
}
