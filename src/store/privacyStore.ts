import { create } from 'zustand';

interface PrivacyState {
  hidden: boolean;
  toggle: () => void;
}

/** Session-only balance masking (resets on relaunch, by design). */
export const usePrivacyStore = create<PrivacyState>((set) => ({
  hidden: false,
  toggle: () => set((s) => ({ hidden: !s.hidden })),
}));
