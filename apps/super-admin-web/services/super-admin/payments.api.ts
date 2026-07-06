import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type {
  CpPaymentsListResponse,
  CpPlansListResponse,
} from '@/types/control-plane.types';

import api from '../axiosInstance';

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useGetPlans = () => {
  return useQuery<AxiosResponse<CpPlansListResponse>, AxiosError>({
    queryKey: ['adminPlans'],
    queryFn: () => api.get('/plans'),
  });
};
export const useGetSubscriptionPlans = useGetPlans;

export const useCreatePlan = () => {
  return useMutation<
    AxiosResponse<CpPlansListResponse>,
    AxiosError,
    Partial<Omit<PaymentPlan, 'id'>>
  >({
    mutationFn: data => api.post('/plans', data),
  });
};
export const useCreateSubscriptionPlan = useCreatePlan;

export const useDeleteSubscriptionPlan = () => {
  return useMutation<AxiosResponse<{ ok: true }>, AxiosError, string>({
    mutationFn: planId => api.delete(`/plans/${planId}`),
  });
};

export const useGetPayments = (
  params: { page?: number; limit?: number } = {}
) => {
  return useQuery<AxiosResponse<CpPaymentsListResponse>, AxiosError>({
    queryKey: ['adminPayments', params.page, params.limit],
    queryFn: () =>
      api.get('/billing/payments', {
        params: { page: params.page || 1, limit: params.limit || 20 },
      }),
  });
};
export const useGetAllPayments = useGetPayments;

export const useUpdateSubscriptionPlan = () => {
  return useMutation<
    AxiosResponse<CpPlansListResponse>,
    AxiosError,
    { id: string } & Partial<Omit<PaymentPlan, 'id'>>
  >({
    mutationFn: ({ id, ...data }) => api.put(`/plans/${id}`, data),
  });
};
