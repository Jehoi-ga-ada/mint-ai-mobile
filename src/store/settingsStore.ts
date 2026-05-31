import { create } from 'zustand';

import {
  type DefaultRangeMode,
  loadSettings,
  saveSettings,
} from '../api/settingsStorage';
import { type DateRange, rangeForCycle, rangeForPreset } from '../utils/dateRange';

export type { DefaultRangeMode };

const DEFAULT_CYCLE_DAY = 25;

interface SettingsState {
  defaultRange: DefaultRangeMode;
  cycleDay: number;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setDefaultRange: (mode: DefaultRangeMode) => Promise<void>;
  setCycleDay: (day: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  defaultRange: 'month',
  cycleDay: DEFAULT_CYCLE_DAY,
  hydrated: false,

  hydrate: async () => {
    const persisted = await loadSettings();
    set({
      defaultRange: persisted?.defaultRange ?? 'month',
      cycleDay: persisted?.cycleDay ?? DEFAULT_CYCLE_DAY,
      hydrated: true,
    });
  },

  setDefaultRange: async (mode) => {
    set({ defaultRange: mode });
    await saveSettings({ defaultRange: mode, cycleDay: get().cycleDay });
  },

  setCycleDay: async (day) => {
    set({ cycleDay: day });
    await saveSettings({ defaultRange: get().defaultRange, cycleDay: day });
  },
}));

/** Resolve the persisted default into a concrete date range for `now`. */
export function resolveDefaultRange(
  mode: DefaultRangeMode,
  cycleDay: number,
  now: Date,
): DateRange {
  return mode === 'cycle' ? rangeForCycle(cycleDay, now) : rangeForPreset(mode, now);
}
