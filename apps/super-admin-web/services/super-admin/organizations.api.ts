import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type {
  CpOrgEntitlementsGetResponse,
  CpOrgEntitlementsSetResponse,
  CpOrgGetResponse,
  CpOrgsListResponse,
} from '@/types/control-plane.types';

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
  entitlements: (id: string) =>
    [...organizationKeys.detail(id), 'entitlements'] as const,
};

// Types for organization operations
export interface IUpdateOrganizationPayload {
  status: 'pending_approval' | 'active' | 'suspended' | 'trial_expired';
}

export interface ICreateOrganizationPayload {
  name: string;
  email: string;
  password: string;
  generalNumber: number;
  serviceCategory: 'ambulance' | 'police' | 'rescue_team' | 'fire_truck';
  sector: 'hospital' | 'police' | 'fire';
  siloBaseUrl: string;
}

// Get all organizations (admin only)
export const useGetAllOrganizations = (enabled: boolean = true) => {
  return useQuery<AxiosResponse<CpOrgsListResponse>, AxiosError>({
    queryKey: organizationKeys.lists(),
    queryFn: () => api.get(organizationEndpoints.getAll),
    enabled,
  });
};

// Get organization by ID (admin only)
export const useGetOrganizationById = (
  id: string,
  opts?: { enabled?: boolean; includeSilo?: boolean }
) => {
  const enabled = opts?.enabled ?? true;
  const includeSilo = opts?.includeSilo ?? false;

  return useQuery<AxiosResponse<CpOrgGetResponse>, AxiosError>({
    queryKey: [...organizationKeys.detail(id), { includeSilo }],
    queryFn: () =>
      api.get(organizationEndpoints.getById(id), {
        params: includeSilo ? { includeSilo: 'true' } : undefined,
      }),
    enabled: enabled && !!id,
  });
};

// Update organization
export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse,
    AxiosError,
    { id: string; data: IUpdateOrganizationPayload }
  >({
    mutationFn: ({ id, data }) =>
      api.post(organizationEndpoints.updateStatus(id), data),
    onSuccess: (_, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: organizationKeys.detail(variables.id),
      });
    },
  });
};

// delete organization
export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation<AxiosResponse, AxiosError, string>({
    mutationFn: id => api.delete(organizationEndpoints.deleteById(id)),
    onSuccess: (_res, id) => {
      // invalidate and refetch the list
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
      queryClient.removeQueries({ queryKey: organizationKeys.detail(id) });
    },
  });
};

// Create organization
export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation<AxiosResponse, AxiosError, ICreateOrganizationPayload>({
    mutationFn: data => api.post(organizationEndpoints.provision, data),
    onSuccess: () => {
      // Invalidate and refetch the list
      queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
    },
  });
};

export const useGetOrganizationEntitlements = (
  id: string,
  opts?: { enabled?: boolean }
) => {
  const enabled = opts?.enabled ?? true;

  return useQuery<AxiosResponse<CpOrgEntitlementsGetResponse>, AxiosError>({
    queryKey: organizationKeys.entitlements(id),
    queryFn: () => api.get(organizationEndpoints.entitlements(id)),
    enabled: enabled && !!id,
    retry: false,
  });
};

export const useSetOrganizationEntitlements = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse<CpOrgEntitlementsSetResponse>,
    AxiosError,
    {
      id: string;
      entitlements: {
        provider_count_limit: number;
        api_rate_limit_tier: number;
        notification_fallback_quota: number;
        analytics_enabled: boolean;
      };
      pushToSilo?: boolean;
    }
  >({
    mutationFn: ({ id, entitlements, pushToSilo }) =>
      api.post(organizationEndpoints.entitlements(id), {
        entitlements,
        pushToSilo: !!pushToSilo,
      }),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({
        queryKey: organizationKeys.entitlements(variables.id),
      });
    },
  });
};
