import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';

interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
}

interface Payment {
  id: string;
  organizationId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export const useGetPlans = () => {
  return useQuery<AxiosResponse<ApiResponse<PaymentPlan[]>>, AxiosError>({
    queryKey: ['adminPlans'],
    queryFn: () => api.get('/plans'),
  });
};
export const useGetSubscriptionPlans = useGetPlans;

export const useCreatePlan = () => {
  return useMutation<
    AxiosResponse<ApiResponse<PaymentPlan>>,
    AxiosError,
    Omit<PaymentPlan, 'id'>
  >({
    mutationFn: data => api.post('/plans', data),
  });
};
export const useCreateSubscriptionPlan = useCreatePlan;

export const useDeleteSubscriptionPlan = () => {
  return useMutation<AxiosResponse<ApiResponse<void>>, AxiosError, string>({
    mutationFn: planId => api.delete(`/plans/${planId}`),
  });
};

export const useGetPayments = () => {
  return useQuery<AxiosResponse<ApiResponse<Payment[]>>, AxiosError>({
    queryKey: ['adminPayments'],
    queryFn: () => api.get('/billing/payments'),
  });
};
export const useGetAllPayments = useGetPayments;
