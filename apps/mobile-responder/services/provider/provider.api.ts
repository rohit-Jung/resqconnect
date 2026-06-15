import type {
  AuthEndpoints,
  ServiceProviderEndpoints,
} from '@repo/types/api/endpoints';
import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';
import { serviceProviderEndpoints } from '../endPoints';

export const useLoginProvider = () => {
  return useMutation<
    AxiosResponse<ApiResponse<ServiceProviderEndpoints.LoginResponse>>,
    AxiosError,
    ServiceProviderEndpoints.LoginRequest
  >({
    mutationFn: data => api.post(serviceProviderEndpoints.login, data),
  });
};

export const useRegisterProvider = () => {
  return useMutation<
    AxiosResponse<ApiResponse<ServiceProviderEndpoints.RegisterResponse>>,
    AxiosError,
    ServiceProviderEndpoints.RegisterRequest
  >({
    mutationFn: data => api.post(serviceProviderEndpoints.register, data),
  });
};

export const useGetProviderProfile = () => {
  return useQuery<
    AxiosResponse<ApiResponse<AuthEndpoints.ProfileResponse>>,
    AxiosError
  >({
    queryKey: ['providerProfile'],
    queryFn: () => api.get(serviceProviderEndpoints.profile),
  });
};
