import type { ApiResponse } from '@repo/types/api/responses';
import { useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';

interface DashboardStats {
  totalOrganizations: number;
  totalUsers: number;
  totalProviders: number;
  monthlyComparisons: { month: string; count: number }[];
}

export const useGetDashboardStats = () => {
  return useQuery<AxiosResponse<ApiResponse<DashboardStats>>, AxiosError>({
    queryKey: ['adminDashboardStats'],
    queryFn: () => api.get('/admin/dashboard-analytics'),
  });
};

export const useDashboardAnalytics = (options?: { enabled?: boolean }) => {
  return useQuery<AxiosResponse<ApiResponse<DashboardStats>>, AxiosError>({
    queryKey: ['adminDashboardAnalytics'],
    queryFn: () => api.get('/admin/dashboard-analytics'),
    enabled: options?.enabled,
  });
};
