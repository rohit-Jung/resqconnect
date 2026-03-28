import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';
import { paymentEndpoints } from '../endPoints';

// Types
export interface ISubscriptionPlan {
  id: string;
  name: string;
  price: number;
  durationMonths: number;
  features: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IPayment {
  id: string;
  organizationId: string;
  subscriptionId?: string;
  amount: number;
  khaltiPidx?: string;
  khaltiTransactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'khalti' | 'esewa' | 'bank_transfer' | 'cash';
  createdAt: string;
  completedAt?: string;
  subscription?: {
    id: string;
    plan: ISubscriptionPlan;
  };
}

export interface IActiveSubscription {
  id: string;
  organizationId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  daysRemaining: number;
  plan: ISubscriptionPlan;
  createdAt: string;
  updatedAt: string;
}

export interface IPaymentHistoryResponse {
  payments: IPayment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ISubscribeResponse {
  pidx: string;
  paymentUrl: string;
  paymentId: string;
}

export interface IPaymentQueryParams {
  page?: number;
  limit?: number;
  status?: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

// Query keys
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters: IPaymentQueryParams) =>
    [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  plans: () => [...paymentKeys.all, 'plans'] as const,
  subscription: () => [...paymentKeys.all, 'subscription'] as const,
};

// Get subscription plans (public)
export const useGetSubscriptionPlans = (enabled: boolean = true) => {
  return useQuery<AxiosResponse<ApiResponse<ISubscriptionPlan[]>>, AxiosError>({
    queryKey: paymentKeys.plans(),
    queryFn: () => api.get(paymentEndpoints.plans),
    enabled,
  });
};

// Get active subscription (org auth required)
export const useGetActiveSubscription = (enabled: boolean = true) => {
  return useQuery<
    AxiosResponse<ApiResponse<IActiveSubscription | null>>,
    AxiosError
  >({
    queryKey: paymentKeys.subscription(),
    queryFn: () => api.get(paymentEndpoints.subscription),
    enabled,
    refetchInterval: 60000,
  });
};

// Get payment history (org auth required)
export const useGetPaymentHistory = (
  params: IPaymentQueryParams = {},
  enabled: boolean = true
) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.status) queryParams.set('status', params.status);

  const queryString = queryParams.toString();
  const url = queryString
    ? `${paymentEndpoints.history}?${queryString}`
    : paymentEndpoints.history;

  return useQuery<
    AxiosResponse<ApiResponse<IPaymentHistoryResponse>>,
    AxiosError
  >({
    queryKey: paymentKeys.list(params),
    queryFn: () => api.get(url),
    enabled,
  });
};

// Get payment by ID (org auth required)
export const useGetPaymentById = (id: string, enabled: boolean = true) => {
  return useQuery<AxiosResponse<ApiResponse<IPayment>>, AxiosError>({
    queryKey: paymentKeys.detail(id),
    queryFn: () => api.get(paymentEndpoints.status(id)),
    enabled: enabled && !!id,
  });
};

// Subscribe to a plan (org auth required)
export const useSubscribeToPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse<ApiResponse<ISubscribeResponse>>,
    AxiosError,
    { planId: string; returnUrl?: string }
  >({
    mutationFn: data => api.post(paymentEndpoints.subscribe, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.subscription() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
};
