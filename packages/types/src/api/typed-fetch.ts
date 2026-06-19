/**
 * Lightweight typed fetch wrapper for frontend apps.
 *
 * No OpenAPI, no codegen. Types come from @repo/types/api/endpoints
 * which are kept in sync with the backend's Zod schemas manually.
 *
 * Usage:
 *   import { api } from '@repo/types/api/typed-fetch';
 *   const res = await api.post<EmergencyEndpoints.CreateResponse>(
 *     '/emergency-request',
 *     { emergencyType: 'ambulance', userLocation: { latitude: 27.7, longitude: 85.3 } }
 *   );
 *   // res.data is typed as EmergencyEndpoints.CreateResponse
 */
import type { ApiResponse } from './responses';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

let _baseUrl = '/api/v1';
let _getToken: () => string | null = () => null;

export function configureApi(baseUrl: string, getToken?: () => string | null) {
  _baseUrl = baseUrl.replace(/\/$/, '') + '/api/v1';
  if (getToken) _getToken = getToken;
}

export function setAuthToken(token: string | null) {
  const staticToken = token;
  _getToken = () => staticToken;
}

async function request<T>(
  method: HttpMethod,
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = _getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${_baseUrl}${path}`, {
    method,
    headers,
    credentials: 'include',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return (await response.json()) as ApiResponse<T>;
}

export const api = {
  get<T>(path: string) {
    return request<T>('GET', path);
  },
  post<T>(path: string, body?: unknown) {
    return request<T>('POST', path, body);
  },
  put<T>(path: string, body?: unknown) {
    return request<T>('PUT', path, body);
  },
  patch<T>(path: string, body?: unknown) {
    return request<T>('PATCH', path, body);
  },
  delete<T>(path: string) {
    return request<T>('DELETE', path);
  },
};
