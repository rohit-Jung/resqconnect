import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type { ApiResponse } from '@/types/auth.types';

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
  organization?: {
    id: string;
    name: string;
  };
  subscription?: {
    id: string;
    plan: ISubscriptionPlan;
  };
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

export interface IPaymentQueryParams {
  page?: number;
  limit?: number;
  status?: string;
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
};

// Get subscription plans
export const useGetSubscriptionPlans = (enabled: boolean = true) => {
  return useQuery<AxiosResponse<ApiResponse<ISubscriptionPlan[]>>, AxiosError>({
    queryKey: paymentKeys.plans(),
    queryFn: () => api.get(paymentEndpoints.plans),
    enabled,
  });
};

// Get all payments (admin)
export const useGetAllPayments = (
  params: IPaymentQueryParams = {},
  enabled: boolean = true
) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.status) queryParams.set('status', params.status);

  const queryString = queryParams.toString();
  const url = queryString
    ? `${paymentEndpoints.getAllPayments}?${queryString}`
    : paymentEndpoints.getAllPayments;

  return useQuery<
    AxiosResponse<ApiResponse<IPaymentHistoryResponse>>,
    AxiosError
  >({
    queryKey: paymentKeys.list(params),
    queryFn: () => api.get(url),
    enabled,
  });
};

// Get payment by ID
export const useGetPaymentById = (id: string, enabled: boolean = true) => {
  return useQuery<AxiosResponse<ApiResponse<IPayment>>, AxiosError>({
    queryKey: paymentKeys.detail(id),
    queryFn: () => api.get(paymentEndpoints.getPaymentById(id)),
    enabled: enabled && !!id,
  });
};

// Create subscription plan
export const useCreateSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse<ApiResponse<ISubscriptionPlan>>,
    AxiosError,
    { name: string; price: number; durationMonths: number; features: string[] }
  >({
    mutationFn: data => api.post(paymentEndpoints.plans, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.plans() });
    },
  });
};

// Update subscription plan
export const useUpdateSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse<ApiResponse<ISubscriptionPlan>>,
    AxiosError,
    {
      id: string;
      name?: string;
      price?: number;
      durationMonths?: number;
      features?: string[];
      isActive?: boolean;
    }
  >({
    mutationFn: ({ id, ...data }) =>
      api.put(paymentEndpoints.planById(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.plans() });
    },
  });
};

// Delete subscription plan
export const useDeleteSubscriptionPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<AxiosResponse<ApiResponse<{}>>, AxiosError, string>({
    mutationFn: id => api.delete(paymentEndpoints.planById(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.plans() });
    },
  });
};
