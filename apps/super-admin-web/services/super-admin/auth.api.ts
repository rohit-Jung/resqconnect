import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import {
  ISuperAdminLoginResponse,
  ISuperAdminProfileResponse,
} from '@/types/auth.types';
import { TSuperAdminLogin } from '@/validations/super-admin.schema';

import api from '../axiosInstance';
import { superAdminEndpoints } from '../endPoints';

export const useSuperAdminLogin = () => {
  return useMutation<
    AxiosResponse<ApiResponse<ISuperAdminLoginResponse>>,
    AxiosError,
    TSuperAdminLogin
  >({
    mutationFn: loginData => {
      return api.post(superAdminEndpoints.login, loginData);
    },
  });
};

export const useSuperAdminProfile = (enabled: boolean = true) => {
  return useQuery<
    AxiosResponse<ApiResponse<ISuperAdminProfileResponse>>,
    AxiosError
  >({
    queryKey: ['superAdminProfile'],
    queryFn: () => api.get(superAdminEndpoints.profile),
    enabled,
  });
};
