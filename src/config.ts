import { Platform } from 'react-native';

/**
 * Backend base URL. Android emulators reach the host machine via 10.0.2.2;
 * iOS simulators use localhost. Override via the API_BASE_URL env at build time
 * if running on a physical device (point it at your machine's LAN IP).
 */
const HOST = Platform.select({ android: '10.0.2.2', default: 'localhost' });

export const API_BASE_URL = `http://${HOST}:8080/api/v1`;

export const SUPPORTED_CURRENCIES = ['IDR', 'USD'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];
