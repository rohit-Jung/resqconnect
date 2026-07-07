import type { ApiResponse, OrganizationEndpoints } from '@repo/types';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type {
  IOrgProfileResponse,
  IOrgProfileWithEntitlements,
} from '@/types/auth.types';

import api from '../axiosInstance';

export const useRegisterOrganization = () => {
  return useMutation<
    AxiosResponse<ApiResponse<OrganizationEndpoints.RegisterResponse>>,
    AxiosError,
    OrganizationEndpoints.RegisterRequest
  >({
    mutationFn: data => api.post('/organization/register', data),
  });
};

export const useLoginOrganization = () => {
  return useMutation<
    AxiosResponse<ApiResponse<OrganizationEndpoints.LoginResponse>>,
    AxiosError,
    OrganizationEndpoints.LoginRequest
  >({
    mutationFn: data => api.post('/organization/login', data),
  });
};

export type OrgLoginSuccessResponse = {
  token: string;
  user: IOrgProfileResponse;
  warnings: string[];
};

export type OrgLoginOtpResponse = {
  organizationId: string;
};

export type OrgLoginResponse = OrgLoginSuccessResponse | OrgLoginOtpResponse;

export const useOrgLogin = () => {
  return useMutation<
    AxiosResponse<ApiResponse<OrgLoginResponse>>,
    AxiosError,
    OrganizationEndpoints.LoginRequest
  >({
    mutationFn: data => api.post('/organization/login', data),
  });
};

export const useOrgProfile = (enabled: boolean = true) => {
  return useQuery<
    AxiosResponse<ApiResponse<IOrgProfileWithEntitlements>>,
    AxiosError
  >({
    queryKey: ['orgProfile'],
    queryFn: () => api.get('/organization/profile'),
    enabled,
  });
};

export const useOrgUpdateProfile = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ organization: IOrgProfileResponse }>>,
    AxiosError,
    Partial<IOrgProfileResponse>
  >({
    mutationFn: data => api.patch('/organization/profile', data),
  });
};

export const useOrgVerify = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ token?: string }>>,
    AxiosError,
    { organizationId: string; otpToken: string }
  >({
    mutationFn: data => api.post('/organization/verify', data),
  });
};

export const useOrgResendVerificationOTP = () => {
  return useMutation<
    AxiosResponse<ApiResponse<Record<string, unknown>>>,
    AxiosError,
    { email: string }
  >({
    mutationFn: data => api.post('/organization/resend-otp', data),
  });
};
