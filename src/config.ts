import { Platform } from 'react-native';

/**
 * Backend base URL.
 * - Android emulators reach the host machine via 10.0.2.2.
 * - iOS uses the Mac's LAN IP so physical devices on the same Wi-Fi reach the
 *   backend too (the simulator reaches it as well — it's this machine). Plain
 *   HTTP to a raw LAN IP is exempt from ATS, so no Info.plist exception needed.
 * - Swap DEV_LAN_HOST for the deployed backend URL when the server goes live.
 */
const DEV_LAN_HOST = '192.168.18.229'; // Mac's Wi-Fi IP — update if DHCP reassigns it

const HOST = Platform.select({ android: '10.0.2.2', default: DEV_LAN_HOST });

export const API_BASE_URL = `http://${HOST}:8080/api/v1`;

export const SUPPORTED_CURRENCIES = ['IDR', 'USD'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
