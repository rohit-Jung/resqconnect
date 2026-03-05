import { useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import { ServiceStatus, ServiceType } from '@/types/auth.types';

import api from '../axiosInstance';
import { orgEndpoints } from '../endPoints';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Service Provider type from the API
export interface IServiceProvider {
  id: string;
  name: string;
  age: number;
  email: string;
  phoneNumber: number;
  primaryAddress: string;
  serviceArea: string | null;
  serviceType: ServiceType;
  isVerified: boolean;
  profilePicture: string | null;
  currentLocation: {
    latitude: string;
    longitude: string;
  } | null;
  vehicleInformation: {
    type: string;
    number: string;
    model: string;
    color: string;
  } | null;
  organizationId: string;
  serviceStatus: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

// Get all service providers for the organization
export const useOrgServiceProviders = (enabled: boolean = true) => {
  return useQuery<AxiosResponse<ApiResponse<IServiceProvider[]>>, AxiosError>({
    queryKey: ['orgServiceProviders'],
    queryFn: () => api.get(orgEndpoints.serviceProviders),
    enabled,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

// Get single service provider by ID
export const useOrgServiceProvider = (id: string, enabled: boolean = true) => {
  return useQuery<AxiosResponse<ApiResponse<IServiceProvider>>, AxiosError>({
    queryKey: ['orgServiceProvider', id],
    queryFn: () => api.get(orgEndpoints.getProvider(id)),
    enabled: enabled && !!id,
  });
};
