import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { TOKEN_KEY } from '@/constants';
import { useProviderStore } from '@/store/providerStore';

const routerVersion = `v1/`;

const api = axios.create({
  // baseURL is injected per-request from persisted org routing.
  baseURL: '',
  withCredentials: true,
});

const apiWithoutAuthLogout = axios.create({
  baseURL: '',
  withCredentials: true,
});

function baseApiUrl() {
  let siloBaseUrl = useProviderStore.getState().siloBaseUrl;
  const fallback = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (siloBaseUrl) {
    siloBaseUrl = siloBaseUrl
      .replace('localhost', '192.168.1.74')
      .replace('127.0.0.1', '192.168.1.74');
  }
  const root = (siloBaseUrl || fallback || '').replace(/\/$/, '');

  console.log(`[AxiosInstance] Using API root: ${root}`);
  return root ? `${root}/api/${routerVersion}` : '';
}

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

const isAuthError = (errorMessage?: string): boolean => {
  if (!errorMessage) return false;
  const lowerMessage = errorMessage.toLowerCase();
  return AUTH_ERROR_MESSAGES.some(msg => lowerMessage.includes(msg));
};

const handleLogout = async () => {
  console.log('[AxiosInstance] Logging out due to auth error');
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (e) {
    console.error('[AxiosInstance] Failed to delete token:', e);
  }
  useProviderStore.getState().setProvider(null);
};

const addAuthToken = async (config: any) => {
  // Inject baseURL at request-time so we can route to the selected silo.
  config.baseURL = baseApiUrl();
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  console.log('[AxiosInstance] Adding auth token to request:', !!token, token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(addAuthToken, error => Promise.reject(error));

apiWithoutAuthLogout.interceptors.request.use(addAuthToken, error =>
  Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  async (error: AxiosError<{ message?: string; error?: string }>) => {
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

apiWithoutAuthLogout.interceptors.response.use(
  response => response,
  (error: AxiosError) => Promise.reject(error)
);

export default api;
export { apiWithoutAuthLogout };
