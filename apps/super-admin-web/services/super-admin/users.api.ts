import { useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type { ApiResponse, IUser } from '@/types/auth.types';

import api from '../axiosInstance';
import { userEndpoints } from '../endPoints';

// Query keys for cache management
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// Get user by ID
export const useGetUserById = (id: string, enabled: boolean = true) => {
  return useQuery<AxiosResponse<ApiResponse<IUser>>, AxiosError>({
    queryKey: userKeys.detail(id),
    queryFn: () => api.get(userEndpoints.getById(id)),
    enabled: enabled && !!id,
  });
};

// Note: The backend currently doesn't have a "get all users" endpoint for admin
// Users data is fetched through the dashboard analytics endpoint
// If a dedicated endpoint is added later, implement useGetAllUsers here
