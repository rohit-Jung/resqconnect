import axios from 'axios';

import {
  getTokenFromStorage,
  removeTokenFromStorage,
} from '@/lib/hooks/useLocalStorage';

const controlPlaneApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_CONTROL_PLANE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

controlPlaneApi.interceptors.request.use(
  config => {
    const token = getTokenFromStorage('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

controlPlaneApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      removeTokenFromStorage('token');
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

export default controlPlaneApi;
