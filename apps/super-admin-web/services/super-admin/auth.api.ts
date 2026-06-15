import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';

interface AdminProfile {
  id: string;
  name: string;
  email: string;
}

interface LoginResponse {
  token: string;
  admin: { id: string; name: string; email: string };
}

export const useLoginAdmin = () => {
  return useMutation<
    AxiosResponse<ApiResponse<LoginResponse>>,
    AxiosError,
    { email: string; password: string }
  >({
    mutationFn: data => api.post('/auth/login', data),
  });
};
export const useSuperAdminLogin = useLoginAdmin;

export const useAdminProfile = (options?: { enabled?: boolean }) => {
  return useQuery<AxiosResponse<ApiResponse<AdminProfile>>, AxiosError>({
    queryKey: ['adminProfile'],
    queryFn: () => api.get('/auth/me'),
    enabled: options?.enabled,
    retry: false,
  });
};

export const useAdminUpdateProfile = () => {
  return useMutation<
    AxiosResponse<ApiResponse<AdminProfile>>,
    AxiosError,
    { name?: string; email?: string }
  >({
    mutationFn: data => api.put('/auth/profile', data),
  });
};
