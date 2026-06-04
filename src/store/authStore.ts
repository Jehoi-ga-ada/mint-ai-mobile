import { create } from 'zustand';

import { clearToken, loadToken, saveToken } from '../api/tokenStorage';

type AuthStatus = 'loading' | 'authed' | 'guest';

interface AuthState {
  token: string | null;
  /** Username typed at sign-in, shown in Settings. Login returns only a token,
   * so we capture it here rather than calling a /me endpoint. */
  username: string | null;
  status: AuthStatus;
  hydrate: () => Promise<void>;
  signIn: (token: string, username?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  username: null,
  status: 'loading',

  hydrate: async () => {
    try {
      const token = await loadToken();
      set({ token, status: token ? 'authed' : 'guest' });
    } catch {
      set({ token: null, status: 'guest' });
    }
  },

  signIn: async (token: string, username?: string) => {
    await saveToken(token);
    set({ token, username: username ?? null, status: 'authed' });
  },

  // Sign-out drops the server session only. Local Money data is owned by the
  // money store and is intentionally left untouched.
  signOut: async () => {
    await clearToken();
    set({ token: null, username: null, status: 'guest' });
  },
}));
