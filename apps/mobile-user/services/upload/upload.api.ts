import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';
import { uploadEndpoints } from '../endPoints';

interface UploadSignatureResponse {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
}

export const useGetUploadSignature = () => {
  return useMutation<
    AxiosResponse<ApiResponse<UploadSignatureResponse>>,
    AxiosError,
    { fileType: string }
  >({
    mutationFn: data => api.get(uploadEndpoints.getSignature, { params: data }),
  });
};
