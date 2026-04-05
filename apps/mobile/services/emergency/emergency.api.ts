import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import {
  ICreateEmergencyResponse,
  IEmergencyHistoryResponse,
  IEmergencyRequest,
  INearbyProvider,
} from '@/types/emergency.types';
import { TCreateEmergencyRequest } from '@/validations/emergency.schema';

import api from '../axiosInstance';
import {
  emergencyRequestEndpoints,
  serviceProviderEndpoints,
} from '../endPoints';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const useCreateEmergencyRequest = () => {
  return useMutation<
    AxiosResponse<ApiResponse<ICreateEmergencyResponse>>,
    AxiosError,
    TCreateEmergencyRequest
  >({
    mutationFn: emergencyData => {
      return api.post(emergencyRequestEndpoints.create, emergencyData);
    },
  });
};

export const useGetEmergencyRequest = (
  requestId: string,
  enabled: boolean = true
) => {
  return useQuery<AxiosResponse<ApiResponse<IEmergencyRequest>>, AxiosError>({
    queryKey: ['emergencyRequest', requestId],
    queryFn: () => api.get(emergencyRequestEndpoints.getById(requestId)),
    enabled: enabled && !!requestId,
    refetchInterval: 5000, // Refetch every 5 seconds to check status
  });
};

export const useCancelEmergencyRequest = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ message: string }>>,
    AxiosError,
    string
  >({
    mutationFn: requestId => {
      return api.patch(emergencyRequestEndpoints.cancel(requestId));
    },
  });
};

export const useConfirmProviderArrival = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ message: string }>>,
    AxiosError,
    string
  >({
    mutationFn: requestId => {
      return api.patch(emergencyRequestEndpoints.confirmArrival(requestId));
    },
  });
};

export const useProviderConfirmArrival = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ message: string }>>,
    AxiosError,
    string
  >({
    mutationFn: requestId => {
      console.log(
        '[API REQUEST]',
        emergencyRequestEndpoints.providerConfirmArrival(requestId)
      );
      return api.patch(
        emergencyRequestEndpoints.providerConfirmArrival(requestId)
      );
    },
  });
};

export const useCompleteEmergencyRequest = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ message: string }>>,
    AxiosError,
    string
  >({
    mutationFn: requestId => {
      return api.post(emergencyRequestEndpoints.complete(requestId));
    },
  });
};

interface GetNearbyProvidersParams {
  latitude: number;
  longitude: number;
  serviceType: string;
}

export const useGetNearbyProviders = (
  params: GetNearbyProvidersParams,
  enabled: boolean = true
) => {
  return useQuery<AxiosResponse<{ providers: INearbyProvider[] }>, AxiosError>({
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
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};

// History hooks
interface HistoryParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const useGetUserEmergencyHistory = (
  params: HistoryParams = {},
  enabled: boolean = true
) => {
  return useQuery<AxiosResponse<IEmergencyHistoryResponse>, AxiosError>({
    queryKey: [
      'userEmergencyHistory',
      params.page,
      params.limit,
      params.status,
    ],
    queryFn: async () => {
      const response = await api.get(emergencyRequestEndpoints.userHistory, {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.status && { status: params.status }),
        },
      });

      return response?.data || {};
    },
    enabled,
  });
};

export const useGetProviderEmergencyHistory = (
  params: HistoryParams = {},
  enabled: boolean = true
) => {
  return useQuery<AxiosResponse<IEmergencyHistoryResponse>, AxiosError>({
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
