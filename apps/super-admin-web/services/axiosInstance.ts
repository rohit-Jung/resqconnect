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

api.interceptors.response.use(
  response => response,
  error => {
    if (
      error.response?.status === 401 &&
      window.location.pathname !== '/login'
    ) {
      removeTokenFromStorage('adminToken');
      window.location.href = '/login?expired=1';
    }
    return Promise.reject(error);
  }
);

export default api;
