import type { ApiResponse } from '@repo/types';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  durationMonths: number;
  features: string[];
}

interface PaymentPlanDetail {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  features: string[];
}

interface PaymentSubscription {
  id?: string;
  plan: PaymentPlanDetail;
}

export interface Payment {
  id: string;
  organizationId: string;
  amount: number;
  khaltiPidx?: string | null;
  khaltiTransactionId?: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
  subscription?: PaymentSubscription;
}

export interface ActiveSubscription {
  id: string;
  organizationId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  plan: PaymentPlan;
  createdAt: string;
  updatedAt: string;
}

export interface IPaymentQueryParams {
  page?: number;
  limit?: number;
  status?: string;
}

export const useGetPaymentPlans = () => {
  return useQuery<AxiosResponse<ApiResponse<PaymentPlan[]>>, AxiosError>({
    queryKey: ['paymentPlans'],
    queryFn: () => api.get('/payments/plans'),
  });
};

export const useSubscribe = () => {
  return useMutation<
    AxiosResponse<
      ApiResponse<{ pidx: string; paymentUrl: string; paymentId: string }>
    >,
    AxiosError,
    { planId: string; returnUrl: string }
  >({
    mutationFn: data => api.post('/payments/subscribe', data),
  });
};

export const useGetPaymentHistory = (params: IPaymentQueryParams = {}) => {
  return useQuery<
    AxiosResponse<{
      ok: boolean;
      payments: Payment[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>,
    AxiosError
  >({
    queryKey: ['paymentHistory', params.page, params.limit, params.status],
    queryFn: () =>
      api.get('/payments/history', {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.status ? { status: params.status } : {}),
        },
      }),
  });
};

export const useGetActiveSubscription = () => {
  return useQuery<
    AxiosResponse<{ ok: boolean; subscription: ActiveSubscription | null }>,
    AxiosError
  >({
    queryKey: ['activeSubscription'],
    queryFn: () => api.get('/payments/subscription'),
  });
};

export const useGetPaymentById = (id: string, enabled: boolean = true) => {
  return useQuery<AxiosResponse<{ ok: boolean; payment: Payment }>, AxiosError>(
    {
      queryKey: ['payment', id],
      queryFn: () => api.get(`/payments/${id}`),
      enabled: enabled && !!id,
    }
  );
};

export const useGetPaymentByPidx = (pidx: string, enabled: boolean = true) => {
  return useQuery<AxiosResponse<{ ok: boolean; payment: Payment }>, AxiosError>(
    {
      queryKey: ['paymentByPidx', pidx],
      queryFn: () => api.get(`/payments/pidx/${pidx}`),
      enabled: enabled && !!pidx,
    }
  );
};

export const useVerifyPaymentByPidx = () => {
  return useMutation<
    AxiosResponse<ApiResponse<Record<string, unknown>>>,
    AxiosError,
    { pidx: string }
  >({
    mutationFn: data => api.post('/payments/verify', data),
  });
};
