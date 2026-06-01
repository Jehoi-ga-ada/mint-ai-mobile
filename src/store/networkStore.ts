import { create } from 'zustand';

interface NetworkState {
  /** Whether the device currently has a usable internet connection. Optimistic
   * default (true) so the first render doesn't flash an offline state before
   * NetInfo reports in. */
  isOnline: boolean;
  setOnline: (value: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
  isOnline: true,
  setOnline: (value) => set({ isOnline: value }),
}));
