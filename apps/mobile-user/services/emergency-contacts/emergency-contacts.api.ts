import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';
import { emergencyContactEndpoints } from '../endPoints';

interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  notifyOnEmergency: boolean;
}

export const useGetEmergencyContacts = () => {
  return useQuery<AxiosResponse<ApiResponse<EmergencyContact[]>>, AxiosError>({
    queryKey: ['emergencyContacts'],
    queryFn: () => api.get(emergencyContactEndpoints.getAll),
  });
};

export const useCreateEmergencyContact = () => {
  return useMutation<
    AxiosResponse<ApiResponse<EmergencyContact>>,
    AxiosError,
    Omit<EmergencyContact, 'id'>
  >({
    mutationFn: data => api.post(emergencyContactEndpoints.create, data),
  });
};
