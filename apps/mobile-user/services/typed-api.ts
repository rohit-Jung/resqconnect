import type { ApiResponse } from '@repo/types/api/responses';

import api from './axiosInstance';

export async function getTyped<T>(path: string): Promise<ApiResponse<T>> {
  const res = await api.get(path);
  return res.data;
}

export async function postTyped<T>(
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const res = await api.post(path, body);
  return res.data;
}

export async function putTyped<T>(
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const res = await api.put(path, body);
  return res.data;
}

export async function patchTyped<T>(
  path: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  const res = await api.patch(path, body);
  return res.data;
}
