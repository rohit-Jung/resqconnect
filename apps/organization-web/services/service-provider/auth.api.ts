import type { ServiceProviderEndpoints } from '@repo/types/api/endpoints';
import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';

export const useLoginServiceProvider = () => {
  return useMutation<
    AxiosResponse<ApiResponse<ServiceProviderEndpoints.LoginResponse>>,
    AxiosError,
    ServiceProviderEndpoints.LoginRequest
  >({
    mutationFn: data => api.post('/service-provider/login', data),
  });
};
