import type { ApiResponse } from '@repo/types/api/responses';
import { useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';

interface DashboardAnalytics {
  totalRequests: number;
  activeProviders: number;
  completedToday: number;
  avgResponseTime: number | null;
}

export const useGetDashboardAnalytics = (enabled: boolean = true) => {
  return useQuery<AxiosResponse<ApiResponse<DashboardAnalytics>>, AxiosError>({
    queryKey: ['orgDashboardAnalytics'],
    queryFn: () => api.get('/organization/dashboard/analytics'),
    enabled,
  });
};
