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

interface PaymentHistoryItem {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

export const useGetPaymentPlans = () => {
  return useQuery<AxiosResponse<ApiResponse<PaymentPlan[]>>, AxiosError>({
    queryKey: ['paymentPlans'],
    queryFn: () => api.get('/payments/plans'),
  });
};

export const useSubscribe = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ paymentUrl: string }>>,
    AxiosError,
    { planId: string }
  >({
    mutationFn: data => api.post('/payments/subscribe', data),
  });
};

export const useGetPaymentHistory = () => {
  return useQuery<AxiosResponse<ApiResponse<PaymentHistoryItem[]>>, AxiosError>(
    {
      queryKey: ['paymentHistory'],
      queryFn: () => api.get('/payments/history'),
    }
  );
};
