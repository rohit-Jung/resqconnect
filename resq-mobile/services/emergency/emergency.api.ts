import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../axiosInstance';
import { emergencyRequestEndpoints, serviceProviderEndpoints } from '../endPoints';
import { AxiosError, AxiosResponse } from 'axios';
import { TCreateEmergencyRequest } from '@/validations/emergency.schema';
import {
  ICreateEmergencyResponse,
  IEmergencyRequest,
  INearbyProvider,
} from '@/types/emergency.types';

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
    mutationFn: (emergencyData) => {
      return api.post(emergencyRequestEndpoints.create, emergencyData);
    },
  });
};

export const useGetEmergencyRequest = (requestId: string, enabled: boolean = true) => {
  return useQuery<AxiosResponse<ApiResponse<IEmergencyRequest>>, AxiosError>({
    queryKey: ['emergencyRequest', requestId],
    queryFn: () => api.get(emergencyRequestEndpoints.getById(requestId)),
    enabled: enabled && !!requestId,
    refetchInterval: 5000, // Refetch every 5 seconds to check status
  });
};

export const useCancelEmergencyRequest = () => {
  return useMutation<AxiosResponse<ApiResponse<{ message: string }>>, AxiosError, string>({
    mutationFn: (requestId) => {
      return api.post(emergencyRequestEndpoints.cancel(requestId));
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
    queryKey: ['nearbyProviders', params.latitude, params.longitude, params.serviceType],
    queryFn: () =>
      api.get(serviceProviderEndpoints.nearby, {
        params: {
          latitude: params.latitude,
          longitude: params.longitude,
          serviceType: params.serviceType,
        },
      }),
    enabled: enabled && !!params.latitude && !!params.longitude && !!params.serviceType,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};
