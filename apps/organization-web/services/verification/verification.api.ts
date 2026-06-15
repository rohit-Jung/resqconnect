import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';

interface PendingVerification {
  id: string;
  name: string;
  email: string;
  documentStatus: string;
  documents: { type: string; url: string; status: string }[];
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
