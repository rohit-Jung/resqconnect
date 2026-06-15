import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';

interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
}

export const useGetOrgUploadSignature = () => {
  return useMutation<
    AxiosResponse<ApiResponse<UploadSignatureResponse>>,
    AxiosError,
    { fileType: string }
  >({
    mutationFn: data => api.get('/org-upload/signature', { params: data }),
  });
};
