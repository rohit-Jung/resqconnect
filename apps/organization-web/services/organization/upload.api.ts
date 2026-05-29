import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { AxiosError } from 'axios';

import api from '../axiosInstance';
import { orgUploadEndpoints } from '../endPoints';

interface UploadSignatureData {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  publicId?: string;
  uploadUrl: string;
}

export const useUpdateOrgLogo = () => {
  const queryClient = useQueryClient();

  return useMutation<{ logoUrl: string }, AxiosError, { file: File }>({
    mutationFn: async ({ file }) => {
      // 1. get signed upload params from backend
      const sigRes = await api.get<{ data: UploadSignatureData }>(
        orgUploadEndpoints.signature
      );
      const sig = sigRes.data.data;

      // 2. upload directly to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sig.apiKey);
      formData.append('timestamp', sig.timestamp.toString());
      formData.append('signature', sig.signature);
      formData.append('folder', sig.folder);
      if (sig.publicId) formData.append('public_id', sig.publicId);

      const cloudRes = await axios.post<{ secure_url: string }>(
        sig.uploadUrl,
        formData
      );
      const logoUrl = cloudRes.data.secure_url;

      // 3. save the URL to backend
      await api.put(orgUploadEndpoints.logo, { logoUrl });

      return { logoUrl };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgProfile'] });
    },
  });
};

export const useDeleteOrgLogo = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError>({
    mutationFn: async () => {
      await api.delete(orgUploadEndpoints.logo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orgProfile'] });
    },
  });
};
