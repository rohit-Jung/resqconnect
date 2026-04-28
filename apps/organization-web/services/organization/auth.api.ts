import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

// Import response types
import {
  IOrgEntitlements,
  IOrgLoginResponse,
  IOrgProfileResponse,
  IOrgRegisterResponse,
  IOrgVerifyResponse,
  IOtpResponse,
} from '@/types/auth.types';
// Import request types from schemas
import { TOrgLogin, TOrgRegister, TOrgVerify } from '@/validations/org.schema';

import api from '../axiosInstance';
import { orgEndpoints } from '../endPoints';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

const useOrgLogin = () => {
  return useMutation<
    AxiosResponse<ApiResponse<IOrgLoginResponse | IOtpResponse>>,
    AxiosError,
    TOrgLogin
  >({
    mutationFn: loginData => {
      return api.post(orgEndpoints.login, loginData);
    },
  });
};

const useOrgRegister = () => {
  return useMutation<
    AxiosResponse<ApiResponse<IOrgRegisterResponse>>,
    AxiosError,
    TOrgRegister
  >({
    mutationFn: registerData => {
      return api.post(orgEndpoints.register, registerData);
    },
  });
};

const useOrgVerify = () => {
  return useMutation<
    AxiosResponse<ApiResponse<IOrgVerifyResponse>>,
    AxiosError,
    TOrgVerify
  >({
    mutationFn: verifyData => {
      return api.post(orgEndpoints.verify, verifyData);
    },
  });
};

const useOrgResendVerificationOTP = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ organizationId?: string }>>,
    AxiosError,
    { email: string }
  >({
    mutationFn: ({ email }) => {
      return api.post(orgEndpoints.resendOtp, { email });
    },
  });
};

const useOrgProfile = (enabled: boolean = true) => {
  return useQuery<
    AxiosResponse<
      ApiResponse<{ user: IOrgProfileResponse; entitlements: IOrgEntitlements }>
    >,
    AxiosError
  >({
    queryKey: ['orgProfile'],
    queryFn: () => api.get(orgEndpoints.profile),
    enabled,
  });
};

// Organization list item from public list endpoint
export interface IOrgListItem {
  id: string;
  name: string;
  email: string;
  serviceCategory: 'ambulance' | 'police' | 'rescue_team' | 'fire_truck';
}

// Get list of all verified organizations (public)
const useOrgList = (enabled: boolean = true) => {
  return useQuery<AxiosResponse<ApiResponse<IOrgListItem[]>>, AxiosError>({
    queryKey: ['orgList'],
    queryFn: () => api.get(orgEndpoints.list),
    enabled,
  });
};

const useOrgUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse<ApiResponse<{ organization: IOrgProfileResponse }>>,
    AxiosError,
    { name?: string; generalNumber?: string }
  >({
    mutationFn: data => {
      return api.patch(orgEndpoints.updateProfile, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgProfile'] });
    },
  });
};

export {
  useOrgLogin,
  useOrgRegister,
  useOrgVerify,
  useOrgResendVerificationOTP,
  useOrgProfile,
  useOrgList,
  useOrgUpdateProfile,
};
