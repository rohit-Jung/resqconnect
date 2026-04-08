import axios from 'axios';

import {
  getTokenFromStorage,
  removeTokenFromStorage,
} from '@/lib/hooks/useLocalStorage';

const routerVersion = `v1`;

const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL}/${routerVersion}`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    // Get token from localStorage (organization token)
    const token = getTokenFromStorage('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      removeTokenFromStorage('token');
      // Only redirect if not already on login page
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.includes('/login')
      ) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
