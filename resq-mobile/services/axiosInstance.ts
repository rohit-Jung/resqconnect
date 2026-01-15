import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '@/constants';

const routerVersion = `v1/`;

const api = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/${routerVersion}`,
  withCredentials: true,
});

// Add auth token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
