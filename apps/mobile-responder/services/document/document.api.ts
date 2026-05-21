import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

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

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  publicId?: string;
  uploadUrl: string;
}

export interface IDocumentSignaturesResponse {
  statusCode: number;
  message: string;
  data: {
    panCard: CloudinarySignature;
    citizenship: CloudinarySignature;
  };
}

// Get document verification status - uses apiWithoutAuthLogout to prevent auto-logout
export const useGetDocumentStatus = (enabled: boolean = true) => {
  // Avoid querying the status endpoint when no token exists (common during
  // auth routing like "verification pending" flows).
  const tokenQuery = useQuery<string | null, Error>({
    queryKey: ['authToken'],
    queryFn: () => SecureStore.getItemAsync(TOKEN_KEY),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  const hasToken = !!tokenQuery.data;

  return useQuery<AxiosResponse<IDocumentStatusResponse>, AxiosError>({
    queryKey: ['documentStatus'],
    queryFn: () =>
      apiWithoutAuthLogout.get(serviceProviderEndpoints.documentStatus),
    enabled: enabled && hasToken,
    // Poll while the provider is not yet approved.
    // Keeping this derived from the query state avoids extra component state.
    refetchInterval: query => {
      const status = query.state.data?.data?.data?.documentStatus;
      return hasToken && status && status !== 'approved' ? 60000 : false;
    },
    retry: 1,
  });
};

// upload documents (pan card + citizenship) - uses main api with logout capability
export const useUploadDocuments = () => {
  return useMutation<
    AxiosResponse<IUploadDocumentsResponse>,
    AxiosError,
    { panCardUrl: string; citizenshipUrl: string }
  >({
    mutationFn: body =>
      api.post(serviceProviderEndpoints.uploadDocuments, body),
  });
};

export const documentUploadApi = {
  getDocumentUploadSignatures: async (): Promise<{
    panCard: CloudinarySignature;
    citizenship: CloudinarySignature;
  }> => {
    const response = await api.get(serviceProviderEndpoints.documentSignatures);
    console.log(
      '[Document Upload] Received upload signatures',
      JSON.stringify(response.data, null, 2)
    );
    return response.data.data;
  },

  uploadToCloudinary: async (
    fileUri: string,
    fileName: string,
    mimeType: string,
    signature: CloudinarySignature
  ): Promise<{ secure_url: string }> => {
    const formData = new FormData();
    const file = {
      uri: fileUri,
      type: mimeType,
      name: fileName,
    } as unknown as Blob;

    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', signature.timestamp.toString());
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);
    if (signature.publicId) {
      formData.append('public_id', signature.publicId);
    }

    console.log('upload url', signature.uploadUrl);
    const response = await fetch(signature.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      console.log(
        '[Document Upload] Cloudinary upload failed',
        JSON.stringify(error, null, 2)
      );
      throw new Error(error.error?.message || 'Failed to upload document');
    }

    return response.json();
  },
};
