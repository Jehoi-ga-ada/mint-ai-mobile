import axios from 'axios';

import { API_BASE_URL } from '../config';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Attach the JWT from the auth store to every request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A 401 means the token is gone/expired — drop the session so the UI returns to login.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && useAuthStore.getState().status === 'authed') {
      await useAuthStore.getState().signOut();
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail ?? error.response?.data?.message;
    if (typeof detail === 'string') {
      return detail;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error';
}
