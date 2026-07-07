import type { ApiResponse, ServiceProviderEndpoints } from '@repo/types';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type { ServiceStatus, ServiceType } from '@/types/auth.types';

import api from '../axiosInstance';

interface ProviderListResponse {
  providers: ServiceProviderEndpoints.NearbyProvider[];
  total: number;
}

export const useGetOrgProviders = (
  params: { page?: number; limit?: number } = {},
  enabled: boolean = true
) => {
  return useQuery<AxiosResponse<ApiResponse<ProviderListResponse>>, AxiosError>(
    {
      queryKey: ['orgProviders', params.page, params.limit],
      queryFn: () =>
        api.get('/organization/providers', {
          params: { page: params.page || 1, limit: params.limit || 20 },
        }),
      enabled,
    }
  );
};

export const useRegisterProvider = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ id: string }>>,
    AxiosError,
    ServiceProviderEndpoints.RegisterRequest
  >({
    mutationFn: data => api.post('/organization/providers', data),
  });
};

export interface IServiceProvider {
  id: string;
  name: string;
  email: string;
  phoneNumber: number;
  serviceType: ServiceType;
  serviceStatus: ServiceStatus;
  isVerified: boolean;
  primaryAddress?: string;
  serviceArea?: string;
  currentLocation?: {
    latitude: string;
    longitude: string;
  };
  vehicleInformation?: {
    type: string;
    number: string;
  };
}

export const useOrgServiceProviders = (
  params: { page?: number; limit?: number } = {}
) => {
  return useQuery<AxiosResponse<ApiResponse<IServiceProvider[]>>, AxiosError>({
    queryKey: ['orgServiceProviders', params.page, params.limit],
    queryFn: () =>
      api.get('/organization/providers', {
        params: { page: params.page || 1, limit: params.limit || 100 },
      }),
  });
};
