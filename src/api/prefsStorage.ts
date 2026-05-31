import * as Keychain from 'react-native-keychain';

const SERVICE = 'mint-ai-prefs';

export interface PersistedPrefs {
  lastAccountId?: string | null;
  lastExpenseCategoryId?: string | null;
  lastIncomeCategoryId?: string | null;
}

export async function loadPrefs(): Promise<PersistedPrefs | null> {
  try {
    const creds = await Keychain.getGenericPassword({ service: SERVICE });
    return creds ? (JSON.parse(creds.password) as PersistedPrefs) : null;
  } catch {
    return null;
  }
}

export async function savePrefs(prefs: PersistedPrefs): Promise<void> {
  await Keychain.setGenericPassword('prefs', JSON.stringify(prefs), { service: SERVICE });
}
