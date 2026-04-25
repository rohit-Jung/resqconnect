import { useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type { ApiResponse, IServiceProvider } from '@/types/auth.types';

import api from '../axiosInstance';

// Query keys for cache management
export const serviceProviderKeys = {
  all: ['serviceProviders'] as const,
  lists: () => [...serviceProviderKeys.all, 'list'] as const,
  nearby: (params: INearbyProvidersParams) =>
    [...serviceProviderKeys.lists(), 'nearby', params] as const,
  details: () => [...serviceProviderKeys.all, 'detail'] as const,
  detail: (id: string) => [...serviceProviderKeys.details(), id] as const,
};

// Query parameters for nearby providers
export interface INearbyProvidersParams {
  latitude: number;
  longitude: number;
  radius?: number;
  serviceType?: 'ambulance' | 'police' | 'fire_brigade';
}

// Get nearby service providers
export const useGetNearbyProviders = (
  params: INearbyProvidersParams,
  enabled: boolean = true
) => {
  void api;
  void enabled;
  return useQuery<AxiosResponse<ApiResponse<IServiceProvider[]>>, AxiosError>({
    queryKey: serviceProviderKeys.nearby(params),
    queryFn: async () => {
      // Control plane does not expose this endpoint.
      throw new Error('Not implemented');
    },
    enabled: false,
  });
};

// Get service provider by ID
export const useGetServiceProviderById = (
  id: string,
  enabled: boolean = true
) => {
  void api;
  void enabled;
  return useQuery<AxiosResponse<ApiResponse<IServiceProvider>>, AxiosError>({
    queryKey: serviceProviderKeys.detail(id),
    queryFn: async () => {
      // Control plane does not replicate per-provider details yet.
      throw new Error('Not implemented');
    },
    enabled: false,
  });
};

// Note: Service providers data for admin is primarily fetched through dashboard analytics
// Individual provider details can be fetched using useGetServiceProviderById
// The nearby providers endpoint is public and doesn't require auth
