import axios from 'axios';

import {
  getTokenFromStorage,
  removeTokenFromStorage,
} from '@/lib/hooks/useLocalStorage';

const api = axios.create({
  // control-plane backend does not use a /v1 router prefix.
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}`,
  withCredentials: true,
});

// add request interceptor to attach auth token
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

// add response interceptor to handle auth errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      removeTokenFromStorage('adminToken');
      if (typeof window !== 'undefined') {
        // Avoid hard-reloading the login page when a login attempt fails (401).
        // The login screen should show an error instead.
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
