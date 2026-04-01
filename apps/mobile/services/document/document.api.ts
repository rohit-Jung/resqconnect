import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

import { TOKEN_KEY } from '@/constants';

import api, { apiWithoutAuthLogout } from '../axiosInstance';
import { serviceProviderEndpoints } from '../endPoints';

// Types
export interface IDocumentStatus {
  documentStatus: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  rejectionReason: string | null;
  verifiedAt: string | null;
}

export interface IDocumentStatusResponse {
  statusCode: number;
  message: string;
  data: IDocumentStatus;
}

export interface IUploadDocumentsResponse {
  statusCode: number;
  message: string;
  data: {
    provider: {
      id: string;
      name: string;
      documentStatus: string;
    };
  };
}

// Get document verification status - uses apiWithoutAuthLogout to prevent auto-logout
export const useGetDocumentStatus = (enabled: boolean = true) => {
  const [shouldPoll, setShouldPoll] = useState(false);
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY).then(token => {
      setHasToken(!!token);
    });
  }, []);

  const query = useQuery<AxiosResponse<IDocumentStatusResponse>, AxiosError>({
    queryKey: ['documentStatus'],
    queryFn: () =>
      apiWithoutAuthLogout.get(serviceProviderEndpoints.documentStatus),
    enabled: enabled && hasToken === true,
    refetchInterval: shouldPoll ? 60000 : false,
    retry: 1,
  });

  useEffect(() => {
    const checkAndPoll = async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const isNotApproved =
        query.data?.data?.data?.documentStatus !== 'approved';
      setShouldPoll(!!token && isNotApproved);
    };

    checkAndPoll();
  }, [query.data]);

  return query;
};

// Upload documents (PAN card + Citizenship) - uses main api with logout capability
export const useUploadDocuments = () => {
  return useMutation<
    AxiosResponse<IUploadDocumentsResponse>,
    AxiosError,
    FormData
  >({
    mutationFn: (formData: FormData) =>
      api.post(serviceProviderEndpoints.uploadDocuments, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
  });
};
