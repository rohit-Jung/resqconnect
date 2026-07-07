import type { ApiResponse } from '@repo/types';
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

export const useUpdateOrgLogo = () => {
  return useMutation<
    AxiosResponse<ApiResponse<Record<string, unknown>>>,
    AxiosError,
    { file: File }
  >({
    mutationFn: ({ file }) => {
      const formData = new FormData();
      formData.append('file', file);
      return api.put('/org/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  });
};

export const useDeleteOrgLogo = () => {
  return useMutation<
    AxiosResponse<ApiResponse<Record<string, unknown>>>,
    AxiosError,
    void
  >({
    mutationFn: () => api.delete('/org/logo'),
  });
};
