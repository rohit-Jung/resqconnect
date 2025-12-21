import axios from 'axios';

const routerVersion = `v1/`;

const api = axios.create({
  baseURL: `${process.env.EXPO_PUBLIC_BACKEND_URL}/${routerVersion}`,
  withCredentials: true,
});

export default api;
