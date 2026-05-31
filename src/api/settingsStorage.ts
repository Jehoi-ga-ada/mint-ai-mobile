import * as Keychain from 'react-native-keychain';

export type DefaultRangeMode = 'month' | '3m' | '6m' | '1y' | 'all' | 'cycle';

const SERVICE = 'mint-ai-settings';

export interface PersistedSettings {
  defaultRange: DefaultRangeMode;
  cycleDay: number;
}

export async function loadSettings(): Promise<PersistedSettings | null> {
  try {
    const creds = await Keychain.getGenericPassword({ service: SERVICE });
    return creds ? (JSON.parse(creds.password) as PersistedSettings) : null;
  } catch {
    return null;
  }
}

export async function saveSettings(settings: PersistedSettings): Promise<void> {
  await Keychain.setGenericPassword('settings', JSON.stringify(settings), {
    service: SERVICE,
  });
}
