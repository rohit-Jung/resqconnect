import type { UserEndpoints } from '@repo/types/api/endpoints';
import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';
import { userEndpoints } from '../endPoints';

export const useGetProfile = () => {
  return useQuery<
    AxiosResponse<ApiResponse<UserEndpoints.ProfileResponse>>,
    AxiosError
  >({
    queryKey: ['userProfile'],
    queryFn: () => api.get(userEndpoints.profile),
  });
};

export const useUpdateProfile = () => {
  return useMutation<
    AxiosResponse<ApiResponse<UserEndpoints.ProfileResponse>>,
    AxiosError,
    UserEndpoints.UpdateProfileRequest
  >({
    mutationFn: data => api.put(userEndpoints.updateProfile, data),
  });
};
