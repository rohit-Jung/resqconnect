import type { ApiResponse, ServiceProviderEndpoints } from '@repo/types';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type { IServiceProviderProfileResponse } from '@/types/auth.types';

import api from '../axiosInstance';

export type ServiceType = 'ambulance' | 'police' | 'fire_truck' | 'rescue_team';

export interface IBulkProviderRow {
  name: string;
  email: string;
  age: number;
  phoneNumber: number;
  primaryAddress: string;
  serviceType: ServiceType;
  password: string;
}

export interface IBulkProviderResult {
  row: number;
  email: string;
  status: 'created' | 'failed';
  error?: string;
}

export const useLoginServiceProvider = () => {
  return useMutation<
    AxiosResponse<ApiResponse<ServiceProviderEndpoints.LoginResponse>>,
    AxiosError,
    ServiceProviderEndpoints.LoginRequest
  >({
    mutationFn: data => api.post('/service-provider/login', data),
  });
};

export const useOrgBulkRegisterProviders = () => {
  return useMutation<
    AxiosResponse<
      ApiResponse<{
        created: number;
        failed: number;
        results: IBulkProviderResult[];
      }>
    >,
    AxiosError,
    { rows: IBulkProviderRow[] }
  >({
    mutationFn: data => api.post('/service-provider/bulk-register', data),
  });
};

export interface IOrgRegisterProviderRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber: number;
  age: number;
  primaryAddress: string;
  serviceType: ServiceType;
  organizationId: string;
  panCardUrl?: string;
  citizenshipUrl?: string;
}

export const useOrgRegisterProvider = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ id: string }>>,
    AxiosError,
    IOrgRegisterProviderRequest
  >({
    mutationFn: data => api.post('/organization/providers', data),
  });
};

export const useOrgDeleteProvider = () => {
  return useMutation<
    AxiosResponse<ApiResponse<Record<string, unknown>>>,
    AxiosError,
    string
  >({
    mutationFn: id => api.delete(`/service-provider/${id}`),
  });
};

export const useOrgServiceProvider = (id: string, enabled: boolean = true) => {
  return useQuery<
    AxiosResponse<
      ApiResponse<{ serviceProvider: IServiceProviderProfileResponse }>
    >,
    AxiosError
  >({
    queryKey: ['orgServiceProvider', id],
    queryFn: () => api.get(`/service-provider/${id}`),
    enabled: enabled && !!id,
  });
};

export const useOrgServiceProviders = (enabled: boolean = true) => {
  return useQuery<
    AxiosResponse<ApiResponse<Record<string, unknown>[]>>,
    AxiosError
  >({
    queryKey: ['orgServiceProviders'],
    queryFn: () => api.get('/organization/providers'),
    enabled,
  });
};

export const useOrgVerifyProvider = () => {
  return useMutation<
    AxiosResponse<ApiResponse<Record<string, unknown>>>,
    AxiosError,
    string
  >({
    mutationFn: id => api.post(`/service-provider/${id}/verify`),
  });
};

export const useOrgUpdateProvider = () => {
  return useMutation<
    AxiosResponse<ApiResponse<Record<string, unknown>>>,
    AxiosError,
    { id: string; data: Record<string, unknown> }
  >({
    mutationFn: ({ id, data }) => api.patch(`/service-provider/${id}`, data),
  });
};
