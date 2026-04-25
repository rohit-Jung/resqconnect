import { useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type { IDashboardAnalytics } from '@/types/auth.types';

import api from '../axiosInstance';
import { adminEndpoints } from '../endPoints';

// Query keys for cache management
export const dashboardKeys = {
  all: ['dashboard'] as const,
  analytics: () => [...dashboardKeys.all, 'analytics'] as const,
  analyticsWithParams: (params: IDashboardQueryParams) =>
    [...dashboardKeys.analytics(), params] as const,
};

// Query parameters for dashboard analytics
export interface IDashboardQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'asc' | 'desc';
  sortField?: 'createdAt' | 'name' | 'email';
}

// Get dashboard analytics (admin only)
export const useDashboardAnalytics = (
  params: IDashboardQueryParams = {},
  enabled: boolean = true
) => {
  const queryParams = {
    page: params.page || 1,
    limit: params.limit || 5,
    sortBy: params.sortBy || 'desc',
    sortField: params.sortField || 'createdAt',
  };

  return useQuery<
    AxiosResponse<{ ok: true; data: IDashboardAnalytics }>,
    AxiosError
  >({
    queryKey: dashboardKeys.analyticsWithParams(queryParams),
    queryFn: () => api.get(adminEndpoints.dashboard, { params: queryParams }),
    enabled,
  });
};
