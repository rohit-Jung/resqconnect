import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import { ServiceType } from '@/types/auth.types';

import api from '../axiosInstance';
import { orgEndpoints } from '../endPoints';

// Types
export type DocumentStatus =
  | 'not_submitted'
  | 'pending'
  | 'approved'
  | 'rejected';

export interface IPendingVerificationProvider {
  id: string;
  name: string;
  email: string;
  phoneNumber: number;
  serviceType: ServiceType;
  documentStatus: DocumentStatus;
  panCardUrl: string | null;
  citizenshipUrl: string | null;
  createdAt: string;
}

export interface IProviderDocuments {
  id: string;
  name: string;
  email: string;
  phoneNumber: number;
  serviceType: ServiceType;
  documentStatus: DocumentStatus;
  panCardUrl: string | null;
  citizenshipUrl: string | null;
  rejectionReason: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
  createdAt: string;
}

interface ApiResponse<T> {
  data: T;
  message?: string;
}

interface PendingVerificationsResponse {
  providers: IPendingVerificationProvider[];
  count: number;
}

interface ProviderDocumentsResponse {
  provider: IProviderDocuments;
}

interface VerifyDocumentsRequest {
  providerId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
}

interface VerifyDocumentsResponse {
  provider: {
    id: string;
    name: string;
    documentStatus: DocumentStatus;
    rejectionReason: string | null;
    verifiedAt: string | null;
  };
}

// Get all pending verifications for the organization
export const usePendingVerifications = (enabled: boolean = true) => {
  return useQuery<
    AxiosResponse<ApiResponse<PendingVerificationsResponse>>,
    AxiosError
  >({
    queryKey: ['pendingVerifications'],
    queryFn: () => api.get(orgEndpoints.pendingVerifications),
    enabled,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

// Get single provider's documents
export const useProviderDocuments = (
  providerId: string,
  enabled: boolean = true
) => {
  return useQuery<
    AxiosResponse<ApiResponse<ProviderDocumentsResponse>>,
    AxiosError
  >({
    queryKey: ['providerDocuments', providerId],
    queryFn: () => api.get(orgEndpoints.getProviderDocuments(providerId)),
    enabled: enabled && !!providerId,
  });
};

// Verify or reject provider documents
export const useVerifyDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation<
    AxiosResponse<ApiResponse<VerifyDocumentsResponse>>,
    AxiosError,
    VerifyDocumentsRequest
  >({
    mutationFn: ({ providerId, action, rejectionReason }) =>
      api.post(orgEndpoints.verifyDocuments(providerId), {
        action,
        rejectionReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] });
      queryClient.invalidateQueries({ queryKey: ['providerDocuments'] });
      queryClient.invalidateQueries({ queryKey: ['orgServiceProviders'] });
    },
  });
};
