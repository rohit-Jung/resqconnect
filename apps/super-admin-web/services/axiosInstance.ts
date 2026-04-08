import axios from 'axios';

import {
  getTokenFromStorage,
  removeTokenFromStorage,
} from '@/lib/hooks/useLocalStorage';

const routerVersion = `v1`;

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/${routerVersion}`,
  withCredentials: true,
});

// Add request interceptor to attach auth token
api.interceptors.request.use(
  config => {
    const token = getTokenFromStorage('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      removeTokenFromStorage('adminToken');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
