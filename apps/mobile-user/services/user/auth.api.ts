import type { AuthEndpoints } from '@repo/types/api/endpoints';
import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';
import { userEndpoints } from '../endPoints';

export const useLoginUser = () => {
  return useMutation<
    AxiosResponse<ApiResponse<AuthEndpoints.LoginResponse>>,
    AxiosError,
    AuthEndpoints.LoginRequest
  >({
    mutationFn: data => api.post(userEndpoints.login, data),
  });
};

export const useRegisterUser = () => {
  return useMutation<
    AxiosResponse<ApiResponse<AuthEndpoints.RegisterResponse>>,
    AxiosError,
    AuthEndpoints.RegisterRequest
  >({
    mutationFn: data => api.post(userEndpoints.register, data),
  });
};

export const useVerifyOtp = () => {
  return useMutation<
    AxiosResponse<ApiResponse<AuthEndpoints.VerifyOtpResponse>>,
    AxiosError,
    AuthEndpoints.VerifyOtpRequest
  >({
    mutationFn: data => api.post(userEndpoints.verify, data),
  });
};

export const useResendOtp = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ message: string }>>,
    AxiosError,
    { email: string }
  >({
    mutationFn: data => api.post(userEndpoints.resendOtp, data),
  });
};
