import { create } from 'zustand';

import { clearToken, loadToken, saveToken } from '../api/tokenStorage';

type AuthStatus = 'loading' | 'authed' | 'guest';

interface AuthState {
  token: string | null;
  status: AuthStatus;
  hydrate: () => Promise<void>;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  status: 'loading',

  hydrate: async () => {
    try {
      const token = await loadToken();
      set({ token, status: token ? 'authed' : 'guest' });
    } catch {
      set({ token: null, status: 'guest' });
    }
  },

  signIn: async (token: string) => {
    await saveToken(token);
    set({ token, status: 'authed' });
  },

  signOut: async () => {
    await clearToken();
    set({ token: null, status: 'guest' });
  },
}));
