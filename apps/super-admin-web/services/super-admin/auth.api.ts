import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import { removeTokenFromStorage } from '@/lib/hooks/useLocalStorage';
import type {
  CpLoginResponse,
  CpMeResponse,
} from '@/types/control-plane.types';
import type { TSuperAdminLogin } from '@/validations/super-admin.schema';

import api from '../axiosInstance';
import { authEndpoints } from '../endPoints';

// Login mutation - uses /user/login endpoint
// Admin users are regular users with role='admin'
// Returns either IAdminLoginResponse (if verified) or IOtpResponse (if needs verification)
export const useSuperAdminLogin = () => {
  return useMutation<
    AxiosResponse<CpLoginResponse>,
    AxiosError,
    TSuperAdminLogin
  >({
    mutationFn: loginData => {
      return api.post(authEndpoints.login, {
        email: loginData.email,
        password: loginData.password,
      });
    },
  });
};

// Me query - uses /auth/me endpoint
export const useSuperAdminProfile = (enabled: boolean = true) => {
  return useQuery<AxiosResponse<CpMeResponse>, AxiosError>({
    queryKey: ['adminProfile'],
    queryFn: () => api.get(authEndpoints.me),
    enabled,
    retry: false,
  });
};

// Alias for consistency
export const useAdminProfile = (options: { enabled?: boolean } = {}) => {
  return useSuperAdminProfile(options.enabled ?? true);
};

// Logout mutation
export const useAdminLogout = () => {
  const queryClient = useQueryClient();

  return useMutation<AxiosResponse<{ ok: true }>, AxiosError>({
    mutationFn: async () =>
      ({ data: { ok: true } }) as AxiosResponse<{ ok: true }>,
    onSuccess: () => {
      removeTokenFromStorage('adminToken');
      queryClient.clear();
    },
  });
};

// Update admin profile
export const useAdminUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse,
    AxiosError,
    { name?: string; email?: string }
  >({
    mutationFn: async () => {
      throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProfile'] });
    },
  });
};
