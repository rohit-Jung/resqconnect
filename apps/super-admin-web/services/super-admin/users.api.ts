import { useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type { CpUsersListResponse } from '@/types/control-plane.types';

import api from '../axiosInstance';
import { userEndpoints } from '../endPoints';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...userKeys.lists(), filters] as const,
};

export const useGetAllUsers = (opts?: {
  page?: number;
  limit?: number;
  search?: string;
  enabled?: boolean;
}) => {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const search = opts?.search ?? '';
  const enabled = opts?.enabled ?? true;

  return useQuery<AxiosResponse<CpUsersListResponse>, AxiosError>({
    queryKey: userKeys.list({ page, limit, search }),
    queryFn: () =>
      api.get(userEndpoints.getAll, {
        params: {
          page,
          limit,
          ...(search ? { search } : {}),
        },
      }),
    enabled,
  });
};
