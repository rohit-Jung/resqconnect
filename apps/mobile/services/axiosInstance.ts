import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { TOKEN_KEY } from '@/constants';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';

const routerVersion = `v1/`;

const api = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/${routerVersion}`,
  withCredentials: true,
});

// JWT/Auth related error messages from backend
const AUTH_ERROR_MESSAGES = [
  'invalid token',
  'expired token',
  'token expired',
  'jwt expired',
  'jwt malformed',
  'invalid signature',
  'unauthorized',
  'authentication token required',
  'invalid or expired token',
];

// Check if error message indicates an authentication/JWT issue
const isAuthError = (errorMessage?: string): boolean => {
  if (!errorMessage) return false;
  const lowerMessage = errorMessage.toLowerCase();
  return AUTH_ERROR_MESSAGES.some(msg => lowerMessage.includes(msg));
};

// clear tokens and reset stores
const handleLogout = async () => {
  console.log('[AxiosInstance] Logging out due to auth error');
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (e) {
    console.error('[AxiosInstance] Failed to delete token:', e);
  }
  // Reset both stores
  useAuthStore.getState().setUser(null);
  useProviderStore.getState().setProvider(null);
};

// Add auth token to requests
api.interceptors.request.use(
  async config => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  response => response,
  async (error: AxiosError<{ message?: string; error?: string }>) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      console.log(
        '[AxiosInstance] Network error: Server unreachable or no internet connection'
      );
      return Promise.reject(error);
    }

    const status = error.response.status;
    const errorMessage =
      error.response.data?.message || error.response.data?.error || '';

    if (status === 401) {
      console.log('[AxiosInstance] Received 401 Unauthorized - logging out');
      await handleLogout();
      return Promise.reject(error);
    }

    if (status === 403 && isAuthError(errorMessage)) {
      console.log(
        '[AxiosInstance] Received 403 with auth error message - logging out'
      );
      await handleLogout();
      return Promise.reject(error);
    }

    if ((status === 400 || status === 500) && isAuthError(errorMessage)) {
      console.log(
        `[AxiosInstance] Received ${status} with JWT error message - logging out`
      );
      await handleLogout();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
