import { create } from 'zustand';

import { loadPrefs, type PersistedPrefs, savePrefs } from '../api/prefsStorage';
import type { CategoryKind } from '../api/types';

interface PrefsState {
  lastAccountId: string | null;
  lastExpenseCategoryId: string | null;
  lastIncomeCategoryId: string | null;
  hydrate: () => Promise<void>;
  rememberAccount: (id: string) => Promise<void>;
  rememberCategory: (kind: CategoryKind, id: string) => Promise<void>;
}

export const usePrefsStore = create<PrefsState>((set, get) => ({
  lastAccountId: null,
  lastExpenseCategoryId: null,
  lastIncomeCategoryId: null,

  hydrate: async () => {
    const p = await loadPrefs();
    if (p) {
      set({
        lastAccountId: p.lastAccountId ?? null,
        lastExpenseCategoryId: p.lastExpenseCategoryId ?? null,
        lastIncomeCategoryId: p.lastIncomeCategoryId ?? null,
      });
    }
  },

  rememberAccount: async (id) => {
    set({ lastAccountId: id });
    await persist(get);
  },

  rememberCategory: async (kind, id) => {
    set(
      kind === 'income'
        ? { lastIncomeCategoryId: id }
        : { lastExpenseCategoryId: id },
    );
    await persist(get);
  },
}));

async function persist(get: () => PrefsState): Promise<void> {
  const s = get();
  const prefs: PersistedPrefs = {
    lastAccountId: s.lastAccountId,
    lastExpenseCategoryId: s.lastExpenseCategoryId,
    lastIncomeCategoryId: s.lastIncomeCategoryId,
  };
  await savePrefs(prefs);
}

export function lastCategoryFor(state: PrefsState, kind: CategoryKind): string | null {
  return kind === 'income' ? state.lastIncomeCategoryId : state.lastExpenseCategoryId;
}
