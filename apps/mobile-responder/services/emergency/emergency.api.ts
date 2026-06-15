import type {
  EmergencyEndpoints,
  ServiceProviderEndpoints,
} from '@repo/types/api/endpoints';
import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';
import {
  emergencyRequestEndpoints,
  serviceProviderEndpoints,
} from '../endPoints';

export const useGetProviderEmergencyHistory = (
  params: { page?: number; limit?: number; status?: string } = {},
  enabled: boolean = true
) => {
  return useQuery<
    AxiosResponse<ApiResponse<EmergencyEndpoints.HistoryResponse>>,
    AxiosError
  >({
    queryKey: [
      'providerEmergencyHistory',
      params.page,
      params.limit,
      params.status,
    ],
    queryFn: async () => {
      const response = await api.get(
        emergencyRequestEndpoints.providerHistory,
        {
          params: {
            page: params.page || 1,
            limit: params.limit || 10,
            ...(params.status && { status: params.status }),
          },
        }
      );
      return response?.data || {};
    },
    enabled,
  });
};

export const useGetNearbyProviders = (
  params: { latitude: number; longitude: number; serviceType: string },
  enabled: boolean = true
) => {
  return useQuery<
    AxiosResponse<ApiResponse<ServiceProviderEndpoints.NearbyProvider[]>>,
    AxiosError
  >({
    queryKey: [
      'nearbyProviders',
      params.latitude,
      params.longitude,
      params.serviceType,
    ],
    queryFn: () =>
      api.get(serviceProviderEndpoints.nearby, {
        params: {
          latitude: params.latitude,
          longitude: params.longitude,
          serviceType: params.serviceType,
        },
      }),
    enabled:
      enabled &&
      !!params.latitude &&
      !!params.longitude &&
      !!params.serviceType,
    refetchInterval: 10000,
  });
};
