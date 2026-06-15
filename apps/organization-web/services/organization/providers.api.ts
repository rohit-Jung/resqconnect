import type { ServiceProviderEndpoints } from '@repo/types/api/endpoints';
import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

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
