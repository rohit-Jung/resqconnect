import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import {
  IAdminLoginResponse,
  IAdminProfileResponse,
  IAdminVerifyResponse,
  IOtpResponse,
} from '@/types/auth.types';
import {
  TSuperAdminLogin,
  TSuperAdminVerify,
} from '@/validations/super-admin.schema';

import api from '../axiosInstance';
import { authEndpoints } from '../endPoints';

// Login mutation - uses /user/login endpoint
// Admin users are regular users with role='admin'
// Returns either IAdminLoginResponse (if verified) or IOtpResponse (if needs verification)
export const useSuperAdminLogin = () => {
  return useMutation<
    AxiosResponse<ApiResponse<IAdminLoginResponse | IOtpResponse>>,
    AxiosError,
    TSuperAdminLogin
  >({
    mutationFn: loginData => {
      return api.post(authEndpoints.login, loginData);
    },
  });
};

// Verify mutation - uses /user/verify endpoint
export const useSuperAdminVerify = () => {
  return useMutation<
    AxiosResponse<ApiResponse<IAdminVerifyResponse>>,
    AxiosError,
    TSuperAdminVerify
  >({
    mutationFn: verifyData => {
      return api.post(authEndpoints.verify, verifyData);
    },
  });
};

// Profile query - uses /user/profile endpoint
export const useSuperAdminProfile = (enabled: boolean = true) => {
  return useQuery<
    AxiosResponse<ApiResponse<IAdminProfileResponse>>,
    AxiosError
  >({
    queryKey: ['adminProfile'],
    queryFn: () => api.get(authEndpoints.profile),
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

  return useMutation<AxiosResponse, AxiosError>({
    mutationFn: () => api.get(authEndpoints.logout),
    onSuccess: () => {
      localStorage.removeItem('adminToken');
      queryClient.clear();
    },
  });
};

// Update admin profile
export const useAdminUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse<ApiResponse<{ user: IAdminProfileResponse }>>,
    AxiosError,
    { name?: string; email?: string }
  >({
    mutationFn: data => {
      return api.put('/user/update', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProfile'] });
    },
  });
};
