import { useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type { CpUsersListResponse } from '@/types/control-plane.types';

import api from '../axiosInstance';

export const useGetUsers = (
  params: { page?: number; limit?: number; search?: string } = {}
) => {
  return useQuery<AxiosResponse<CpUsersListResponse>, AxiosError>({
    queryKey: ['adminUsers', params.page, params.limit, params.search],
    queryFn: () =>
      api.get('/users', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          search: params.search || undefined,
        },
      }),
  });
};
export const useGetAllUsers = useGetUsers;
