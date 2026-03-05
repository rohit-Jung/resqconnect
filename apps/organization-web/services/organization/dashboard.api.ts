import { useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import { IOrgDashboardAnalytics } from '@/types/auth.types';

import api from '../axiosInstance';
import { orgEndpoints } from '../endPoints';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Get organization dashboard analytics
export const useOrgDashboardAnalytics = (enabled: boolean = true) => {
  return useQuery<
    AxiosResponse<ApiResponse<IOrgDashboardAnalytics>>,
    AxiosError
  >({
    queryKey: ['orgDashboardAnalytics'],
    queryFn: () => api.get(orgEndpoints.dashboardAnalytics),
    enabled,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};
