import type { ApiResponse } from '@repo/types/api/responses';
import { useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

export const useGetUsers = (params: { page?: number; limit?: number } = {}) => {
  return useQuery<AxiosResponse<ApiResponse<User[]>>, AxiosError>({
    queryKey: ['adminUsers', params.page, params.limit],
    queryFn: () =>
      api.get('/users', {
        params: { page: params.page || 1, limit: params.limit || 20 },
      }),
  });
};
export const useGetAllUsers = useGetUsers;
