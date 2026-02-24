import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { TOKEN_KEY } from '@/constants';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';

const routerVersion = `v1/`;

const api = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/${routerVersion}`,
  withCredentials: true,
});

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
  async error => {
    // Handle network errors (no response from server)
    if (!error.response) {
      console.log(
        'Network error: Server unreachable or no internet connection'
      );
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - token is invalid/expired, logout user
    if (error.response.status === 401) {
      console.log('Received 401 Unauthorized - logging out');
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      // Logout from both stores
      useAuthStore.getState().setUser(null);
      useProviderStore.getState().setProvider(null);
    }

    return Promise.reject(error);
  }
);

export default api;
