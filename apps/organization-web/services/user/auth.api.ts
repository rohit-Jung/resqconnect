import type { ApiResponse, AuthEndpoints } from '@repo/types';
import { useMutation } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';

export const useLoginUser = () => {
  return useMutation<
    AxiosResponse<ApiResponse<AuthEndpoints.LoginResponse>>,
    AxiosError,
    AuthEndpoints.LoginRequest
  >({
    mutationFn: data => api.post('/user/login', data),
  });
};

export const useChangePassword = () => {
  return useMutation<
    AxiosResponse<ApiResponse<Record<string, unknown>>>,
    AxiosError,
    { oldPassword: string; newPassword: string }
  >({
    mutationFn: data => api.post('/user/change-password', data),
  });
};

export const useForgotPassword = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ userId: string; otpToken: string }>>,
    AxiosError,
    { email: string }
  >({
    mutationFn: data => api.post('/user/forgot-password', data),
  });
};

export const useResetPassword = () => {
  return useMutation<
    AxiosResponse<ApiResponse<Record<string, unknown>>>,
    AxiosError,
    { userId: string; otpToken: string; password: string }
  >({
    mutationFn: data => api.post('/user/reset-password', data),
  });
};
