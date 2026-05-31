import * as Keychain from 'react-native-keychain';

const SERVICE = 'mint-ai-auth';

export async function saveToken(token: string): Promise<void> {
  await Keychain.setGenericPassword('token', token, { service: SERVICE });
}

export async function loadToken(): Promise<string | null> {
  const creds = await Keychain.getGenericPassword({ service: SERVICE });
  return creds ? creds.password : null;
}

export async function clearToken(): Promise<void> {
  await Keychain.resetGenericPassword({ service: SERVICE });
}
