import axios from 'axios';

// Control-plane is stable and used for org discovery.
// If EXPO_PUBLIC_CONTROL_PLANE_URL isn't set yet, fall back to BACKEND_URL to keep current dev working.
const baseURL = (
  process.env.EXPO_PUBLIC_CONTROL_PLANE_URL ||
  process.env.EXPO_PUBLIC_BACKEND_URL
)?.replace(/\/$/, '');

export const controlPlaneApi = axios.create({
  baseURL,
  withCredentials: false,
});
