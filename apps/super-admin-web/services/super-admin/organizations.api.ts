import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import { IOrganization } from '@/types/auth.types';

import api from '../axiosInstance';
import { organizationEndpoints } from '../endPoints';

// Query keys for cache management
export const organizationKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...organizationKeys.lists(), filters] as const,
  details: () => [...organizationKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationKeys.details(), id] as const,
};

// Types for organization operations
export interface IUpdateOrganizationPayload {
  name?: string;
  generalNumber?: string;
  serviceCategory?: 'ambulance' | 'police' | 'fire_brigade';
  isVerified?: boolean;
}

export interface ICreateOrganizationPayload {
  name: string;
  email: string;
  password: string;
  generalNumber: number;
  serviceCategory: 'ambulance' | 'police' | 'fire_brigade';
}

// Get all organizations (admin only)
export const useGetAllOrganizations = (enabled: boolean = true) => {
  return useQuery<AxiosResponse<ApiResponse<IOrganization[]>>, AxiosError>({
    queryKey: organizationKeys.lists(),
    queryFn: () => api.get(organizationEndpoints.getAll),
    enabled,
  });
};

// Get organization by ID
export const useGetOrganizationById = (id: string, enabled: boolean = true) => {
  return useQuery<AxiosResponse<ApiResponse<IOrganization>>, AxiosError>({
    queryKey: organizationKeys.detail(id),
    queryFn: () => api.get(organizationEndpoints.getById(id)),
    enabled: enabled && !!id,
  });
};

// Update organization
export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse<ApiResponse<{ organization: IOrganization }>>,
    AxiosError,
    { id: string; data: IUpdateOrganizationPayload }
  >({
    mutationFn: ({ id, data }) =>
      api.put(organizationEndpoints.update(id), data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.id),
      });
    },
  });
};

// Delete organization
export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse<ApiResponse<{ organization: IOrganization }>>,
    AxiosError,
    string
  >({
    mutationFn: id => api.delete(organizationEndpoints.delete(id)),
    onSuccess: () => {
      // Invalidate and refetch the list
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
};

// Create organization
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse<ApiResponse<{ organization: IOrganization }>>,
    AxiosError,
    ICreateOrganizationPayload
  >({
    mutationFn: data => api.post(organizationEndpoints.register, data),
    onSuccess: () => {
      // Invalidate and refetch the list
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
};
