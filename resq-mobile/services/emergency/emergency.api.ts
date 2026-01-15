import { useMutation } from '@tanstack/react-query';
import api from '../axiosInstance';
import { emergencyRequestEndpoints } from '../endPoints';
import { AxiosError, AxiosResponse } from 'axios';
import { TCreateEmergencyRequest } from '@/validations/emergency.schema';
import { ICreateEmergencyResponse } from '@/types/emergency.types';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const useCreateEmergencyRequest = () => {
  return useMutation<
    AxiosResponse<ApiResponse<ICreateEmergencyResponse>>,
    AxiosError,
    TCreateEmergencyRequest
  >({
    mutationFn: (emergencyData) => {
      return api.post(emergencyRequestEndpoints.create, emergencyData);
    },
  });
};
