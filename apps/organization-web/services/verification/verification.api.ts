import type { ApiResponse } from '@repo/types';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import type { ServiceType } from '@/types/auth.types';

import api from '../axiosInstance';

export type DocumentStatus =
  | 'not_submitted'
  | 'pending'
  | 'approved'
  | 'rejected';

export interface PendingVerification {
  id: string;
  name: string;
  email: string;
  phoneNumber: number;
  serviceType: ServiceType;
  documentStatus: DocumentStatus;
  panCardUrl?: string;
  citizenshipUrl?: string;
  createdAt?: string;
}

export interface ProviderDocuments {
  id: string;
  name: string;
  email: string;
  phoneNumber: number;
  serviceType: ServiceType;
  documentStatus: DocumentStatus;
  panCardUrl?: string;
  citizenshipUrl?: string;
  rejectionReason?: string | null;
  verifiedAt?: string;
  verifiedBy?: string;
  createdAt?: string;
}

export const useGetPendingVerifications = () => {
  return useQuery<
    AxiosResponse<ApiResponse<PendingVerification[]>>,
    AxiosError
  >({
    queryKey: ['pendingVerifications'],
    queryFn: () => api.get('/service-provider/pending-verifications'),
  });
};

export const usePendingVerifications = () => {
  return useQuery<
    AxiosResponse<
      ApiResponse<{ providers: PendingVerification[]; count: number }>
    >,
    AxiosError
  >({
    queryKey: ['pendingVerifications'],
    queryFn: () => api.get('/service-provider/pending-verifications'),
  });
};

export const useProviderDocuments = (
  providerId: string,
  enabled: boolean = true
) => {
  return useQuery<
    AxiosResponse<ApiResponse<{ provider: ProviderDocuments }>>,
    AxiosError
  >({
    queryKey: ['providerDocuments', providerId],
    queryFn: () => api.get(`/service-provider/${providerId}/documents`),
    enabled: enabled && !!providerId,
  });
};

export const useVerifyProviderDocuments = () => {
  return useMutation<
    AxiosResponse<ApiResponse<{ status: string }>>,
    AxiosError,
    { providerId: string; action: 'approve' | 'reject'; notes?: string }
  >({
    mutationFn: data =>
      api.post(`/service-provider/${data.providerId}/verify-documents`, data),
  });
};

export const useVerifyDocuments = () => {
  return useMutation<
    AxiosResponse<ApiResponse<Record<string, unknown>>>,
    AxiosError,
    {
      providerId: string;
      action: 'approve' | 'reject';
      rejectionReason?: string;
    }
  >({
    mutationFn: data =>
      api.post(`/service-provider/${data.providerId}/verify-documents`, data),
  });
};
