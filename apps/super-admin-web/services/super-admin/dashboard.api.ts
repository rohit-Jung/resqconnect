import { useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type { IDashboardAnalytics } from '@/types/auth.types';

import api from '../axiosInstance';

type ApiResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
  success: boolean;
};

export const useGetDashboardStats = () => {
  return useQuery<AxiosResponse<ApiResponse<IDashboardAnalytics>>, AxiosError>({
    queryKey: ['adminDashboardStats'],
    queryFn: () => api.get('/admin/dashboard-analytics'),
  });
};

export const useDashboardAnalytics = (options?: { enabled?: boolean }) => {
  return useQuery<AxiosResponse<ApiResponse<IDashboardAnalytics>>, AxiosError>({
    queryKey: ['adminDashboardAnalytics'],
    queryFn: () => api.get('/admin/dashboard-analytics'),
    enabled: options?.enabled,
  });
};
