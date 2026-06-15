import type { AuthEndpoints } from '@repo/types/api/endpoints';
import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';
import { userEndpoints } from '../endPoints';

export const useLoginUser = () => {
  return useMutation<
    AxiosResponse<ApiResponse<AuthEndpoints.LoginResponse>>,
    AxiosError,
    AuthEndpoints.LoginRequest
  >({
    mutationFn: data => api.post(userEndpoints.login, data),
  });
};
