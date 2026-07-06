import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type {
  CpOrgEntitlementsGetResponse,
  CpOrgEntitlementsSetResponse,
  CpOrgGetResponse,
  CpOrgsListResponse,
} from '@/types/control-plane.types';

import api from '../axiosInstance';

export interface OrgBulkProvisionRow {
  name: string;
  email: string;
  serviceCategory: string;
  generalNumber: number;
  password: string;
  sector: string;
  siloBaseUrl: string;
}

export interface OrgBulkProvisionResult {
  row: number;
  name: string;
  email: string;
  status: 'created' | 'failed';
  error?: string;
}

export const useGetOrganizations = (
  params: { page?: number; limit?: number } = {}
) => {
  return useQuery<AxiosResponse<CpOrgsListResponse>, AxiosError>({
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
    AxiosResponse<CpOrgGetResponse>,
    AxiosError,
    { orgId: string; lifecycleStatus: string }
  >({
    mutationFn: ({ orgId, lifecycleStatus }) =>
      api.post(`/orgs/${orgId}/status`, { lifecycleStatus }),
  });
};
export const useUpdateOrganization = useUpdateOrganizationStatus;

export const useGetOrganizationById = (
  orgId: string,
  options?: { enabled?: boolean; includeSilo?: boolean }
) => {
  return useQuery<AxiosResponse<CpOrgGetResponse>, AxiosError>({
    queryKey: ['adminOrganization', orgId],
    queryFn: () => api.get(`/orgs/${orgId}`),
    enabled: options?.enabled ?? !!orgId,
  });
};

export const useGetOrganizationEntitlements = (
  orgId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery<AxiosResponse<CpOrgEntitlementsGetResponse>, AxiosError>({
    queryKey: ['adminOrgEntitlements', orgId],
    queryFn: () => api.get(`/orgs/${orgId}/entitlements`),
    enabled: options?.enabled ?? !!orgId,
  });
};

export const useCreateOrganization = () => {
  return useMutation<
    AxiosResponse<CpOrgGetResponse>,
    AxiosError,
    Record<string, unknown>
  >({
    mutationFn: data => api.post('/orgs/provision', data),
  });
};

export const useBulkProvisionOrgs = () => {
  return useMutation<
    AxiosResponse<{
      ok: true;
      results: OrgBulkProvisionResult[];
      created: number;
      failed: number;
    }>,
    AxiosError,
    { rows: OrgBulkProvisionRow[] }
  >({
    mutationFn: data => api.post('/orgs/bulk-provision', data),
  });
};

export const useDeleteOrganization = () => {
  return useMutation<AxiosResponse<{ ok: true }>, AxiosError, string>({
    mutationFn: orgId => api.delete(`/orgs/${orgId}`),
  });
};

export const useSetOrganizationEntitlements = () => {
  return useMutation<
    AxiosResponse<CpOrgEntitlementsSetResponse>,
    AxiosError,
    { id: string; entitlements: Record<string, unknown>; pushToSilo: boolean }
  >({
    mutationFn: ({ id, entitlements, pushToSilo }) =>
      api.put(`/orgs/${id}/entitlements`, { entitlements, pushToSilo }),
  });
};
