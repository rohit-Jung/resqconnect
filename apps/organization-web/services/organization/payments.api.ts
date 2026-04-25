import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import controlPlaneApi from '../controlPlaneAxiosInstance';
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

type CpPlansResponse = {
  ok: boolean;
  plans: ISubscriptionPlan[];
};

type CpMyPaymentsResponse = {
  ok: boolean;
  payments: IPayment[];
  pagination: IPaymentHistoryResponse['pagination'];
};

type CpMyPaymentResponse = {
  ok: boolean;
  payment: IPayment;
};

type CpMySubscriptionResponse = {
  ok: boolean;
  subscription: IActiveSubscription | null;
};

type CpCheckoutResponse = {
  ok: boolean;
  data: {
    pidx: string;
    payment_url: string;
    expires_at?: string;
    expires_in?: number;
  };
};

type CpVerifyResponse = {
  ok: boolean;
  activated?: boolean;
  lookup?: unknown;
};

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
  return useQuery<AxiosResponse<CpPlansResponse>, AxiosError>({
    queryKey: paymentKeys.plans(),
    queryFn: () => controlPlaneApi.get(paymentEndpoints.plans),
    enabled,
  });
};

// Get active subscription (org auth required)
export const useGetActiveSubscription = (enabled: boolean = true) => {
  return useQuery<AxiosResponse<CpMySubscriptionResponse>, AxiosError>({
    queryKey: paymentKeys.subscription(),
    queryFn: () => controlPlaneApi.get(paymentEndpoints.subscription),
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

  return useQuery<AxiosResponse<CpMyPaymentsResponse>, AxiosError>({
    queryKey: paymentKeys.list(params),
    queryFn: () => controlPlaneApi.get(url),
    enabled,
  });
};

// Get payment by ID (org auth required)
export const useGetPaymentById = (id: string, enabled: boolean = true) => {
  return useQuery<AxiosResponse<CpMyPaymentResponse>, AxiosError>({
    queryKey: paymentKeys.detail(id),
    queryFn: () => controlPlaneApi.get(paymentEndpoints.status(id)),
    enabled: enabled && !!id,
  });
};

export const useGetPaymentByPidx = (pidx: string, enabled: boolean = true) => {
  return useQuery<AxiosResponse<CpMyPaymentResponse>, AxiosError>({
    queryKey: paymentKeys.detail(`pidx:${pidx}`),
    queryFn: () => controlPlaneApi.get(paymentEndpoints.byPidx(pidx)),
    enabled: enabled && !!pidx,
  });
};

export const useVerifyPaymentByPidx = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse<CpVerifyResponse>,
    AxiosError,
    { pidx: string }
  >({
    mutationFn: data => controlPlaneApi.post(paymentEndpoints.verify, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.subscription() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: paymentKeys.detail(`pidx:${variables.pidx}`),
      });
    },
  });
};

// Subscribe to a plan (org auth required)
export const useSubscribeToPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AxiosResponse<CpCheckoutResponse>,
    AxiosError,
    { planId: string; returnUrl?: string }
  >({
    // Control-plane checkout is admin/org aware; for org portal we pass planId and returnUrl.
    mutationFn: data =>
      controlPlaneApi.post(paymentEndpoints.subscribe, {
        planId: data.planId,
        returnUrl: data.returnUrl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.subscription() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
};
