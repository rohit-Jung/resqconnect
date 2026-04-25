import { useProviderStore } from '@/store/providerStore';

import api from '../axiosInstance';
import { providerUploadEndpoints, uploadEndpoints } from '../endPoints';

export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  publicId?: string;
  uploadUrl: string;
}

export interface UploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

export interface UpdateProfilePictureResponse {
  id: string;
  name: string;
  email: string;
  phoneNumber: number;
  profilePicture: string | null;
}

export const uploadApi = {
  getUploadSignature: async (): Promise<CloudinarySignature> => {
    const isProvider = !!useProviderStore.getState().provider;
    const response = await api.get(
      isProvider
        ? providerUploadEndpoints.getSignature
        : uploadEndpoints.getSignature
    );
    return response.data.data;
  },

  uploadToCloudinary: async (
    imageUri: string,
    signature: CloudinarySignature
  ): Promise<UploadResult> => {
    const formData = new FormData();

    // Get the file extension from URI
    const uriParts = imageUri.split('.');
    const ext = (uriParts[uriParts.length - 1] || '').toLowerCase();
    const fileType = ext === 'jpg' ? 'jpeg' : ext;

    // Create file object for upload
    const file = {
      uri: imageUri,
      type: `image/${fileType}`,
      name: `profile.${fileType}`,
    } as unknown as Blob;

    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', signature.timestamp.toString());
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);

    if (signature.publicId) {
      formData.append('public_id', signature.publicId);
    }

    const response = await fetch(signature.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to upload image');
    }

    return response.json();
  },

  updateProfilePicture: async (
    profilePictureUrl: string
  ): Promise<UpdateProfilePictureResponse> => {
    const isProvider = !!useProviderStore.getState().provider;
    const response = await api.put(
      isProvider
        ? providerUploadEndpoints.updateProfilePicture
        : uploadEndpoints.updateProfilePicture,
      { profilePictureUrl }
    );
    return isProvider
      ? response.data.data.serviceProvider
      : response.data.data.user;
  },

  deleteProfilePicture: async (): Promise<UpdateProfilePictureResponse> => {
    const isProvider = !!useProviderStore.getState().provider;
    const response = await api.delete(
      isProvider
        ? providerUploadEndpoints.deleteProfilePicture
        : uploadEndpoints.deleteProfilePicture
    );
    return isProvider
      ? response.data.data.serviceProvider
      : response.data.data.user;
  },

  /**
   * Complete flow: Get signature, upload to Cloudinary, update user profile
   */
  uploadProfilePicture: async (imageUri: string): Promise<string> => {
    // Step 1: Get the upload signature
    const signature = await uploadApi.getUploadSignature();

    // Step 2: Upload directly to Cloudinary
    const uploadResult = await uploadApi.uploadToCloudinary(
      imageUri,
      signature
    );

    // Step 3: Update the user's profile picture URL in our backend
    await uploadApi.updateProfilePicture(uploadResult.secure_url);

    return uploadResult.secure_url;
  },
};

export default uploadApi;
