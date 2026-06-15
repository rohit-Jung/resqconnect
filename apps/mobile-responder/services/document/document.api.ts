import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';
import { providerUploadEndpoints } from '../endPoints';

interface DocumentSignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
}

export const useGetDocumentSignatures = () => {
  return useMutation<
    AxiosResponse<ApiResponse<DocumentSignatureResponse[]>>,
    AxiosError,
    { files: string[] }
  >({
    mutationFn: data =>
      api.post(providerUploadEndpoints.documentSignatures, data),
  });
};
