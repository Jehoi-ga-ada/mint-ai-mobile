import { Platform } from 'react-native';

/**
 * Backend base URL.
 * - Release builds talk to the deployed backend over HTTPS.
 * - Debug builds use the dev machine: Android emulators reach it via 10.0.2.2;
 *   iOS uses the Mac's mDNS hostname so the simulator and physical devices on
 *   the same Wi-Fi both work, surviving DHCP reassignment. `.local` hosts are
 *   ATS-exempt, so plain HTTP needs no Info.plist exception.
 */
const PROD_BASE_URL = 'https://mintai.eastasia.cloudapp.azure.com/api/v1';

const DEV_LAN_HOST = 'Jehoiadas-MacBook-Pro-2.local'; // `scutil --get LocalHostName` + .local
const DEV_HOST = Platform.select({ android: '10.0.2.2', default: DEV_LAN_HOST });
const DEV_BASE_URL = `http://${DEV_HOST}:8080/api/v1`;

export const API_BASE_URL = __DEV__ ? DEV_BASE_URL : PROD_BASE_URL;

/**
 * Public privacy policy, shown from Settings and required by App Store Connect.
 * This page must be live and reachable; keep it in sync with the URL you enter
 * in App Store Connect → App Privacy.
 */
export const PRIVACY_POLICY_URL = 'https://mintai.eastasia.cloudapp.azure.com/privacy';

export const SUPPORTED_CURRENCIES = ['IDR', 'USD'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
