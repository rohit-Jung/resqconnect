import type { OrganizationEndpoints } from '@repo/types/api/endpoints';
import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';

export const useRegisterOrganization = () => {
  return useMutation<
    AxiosResponse<ApiResponse<OrganizationEndpoints.RegisterResponse>>,
    AxiosError,
    OrganizationEndpoints.RegisterRequest
  >({
    mutationFn: data => api.post('/organization/register', data),
  });
};

export const useLoginOrganization = () => {
  return useMutation<
    AxiosResponse<ApiResponse<OrganizationEndpoints.LoginResponse>>,
    AxiosError,
    OrganizationEndpoints.LoginRequest
  >({
    mutationFn: data => api.post('/organization/login', data),
  });
};
