import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';

interface Organization {
  id: string;
  name: string;
  email: string;
  serviceCategory: string;
  isVerified: boolean;
  lifecycleStatus: string;
  createdAt: string;
}

interface EntitlementsSnapshot {
  version: number;
  entitlements: Record<string, unknown>;
}

export const useGetOrganizations = (
  params: { page?: number; limit?: number } = {}
) => {
  return useQuery<AxiosResponse<ApiResponse<Organization[]>>, AxiosError>({
    queryKey: ['adminOrganizations', params.page, params.limit],
    queryFn: () =>
      api.get('/orgs', {
        params: { page: params.page || 1, limit: params.limit || 20 },
      }),
  });
};
export const useGetAllOrganizations = useGetOrganizations;

export const useUpdateOrganizationStatus = () => {
  return useMutation<
    AxiosResponse<ApiResponse<Organization>>,
    AxiosError,
    { orgId: string; lifecycleStatus: string }
  >({
    mutationFn: ({ orgId, lifecycleStatus }) =>
      api.post(`/orgs/${orgId}/status`, { lifecycleStatus }),
  });
};
export const useUpdateOrganization = useUpdateOrganizationStatus;

export const useGetOrganizationById = (orgId: string) => {
  return useQuery<AxiosResponse<ApiResponse<Organization>>, AxiosError>({
    queryKey: ['adminOrganization', orgId],
    queryFn: () => api.get(`/orgs/${orgId}`),
    enabled: !!orgId,
  });
};

export const useGetOrganizationEntitlements = (orgId: string) => {
  return useQuery<AxiosResponse<ApiResponse<EntitlementsSnapshot>>, AxiosError>(
    {
      queryKey: ['adminOrgEntitlements', orgId],
      queryFn: () => api.get(`/orgs/${orgId}/entitlements`),
      enabled: !!orgId,
    }
  );
};

export const useCreateOrganization = () => {
  return useMutation<
    AxiosResponse<ApiResponse<Organization>>,
    AxiosError,
    Record<string, unknown>
  >({
    mutationFn: data => api.post('/orgs/provision', data),
  });
};

export const useBulkProvisionOrgs = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ created: number }>>,
    AxiosError,
    { organizations: Record<string, unknown>[] }
  >({
    mutationFn: data => api.post('/orgs/bulk-provision', data),
  });
};

export const useDeleteOrganization = () => {
  return useMutation<AxiosResponse<ApiResponse<void>>, AxiosError, string>({
    mutationFn: orgId => api.delete(`/orgs/${orgId}`),
  });
};
