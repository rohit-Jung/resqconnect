import api from '../axiosInstance';
import { uploadEndpoints } from '../endPoints';

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
  profilePicture: string;
}

export const uploadApi = {
  /**
   * Get a signed upload signature for direct Cloudinary upload
   */
  getUploadSignature: async (): Promise<CloudinarySignature> => {
    const response = await api.get(uploadEndpoints.getSignature);
    return response.data.data;
  },

  /**
   * Upload image directly to Cloudinary using the signed signature
   */
  uploadToCloudinary: async (
    imageUri: string,
    signature: CloudinarySignature
  ): Promise<UploadResult> => {
    const formData = new FormData();

    // Get the file extension from URI
    const uriParts = imageUri.split('.');
    const fileType = uriParts[uriParts.length - 1];

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

  /**
   * Update user's profile picture URL after successful Cloudinary upload
   */
  updateProfilePicture: async (
    profilePictureUrl: string
  ): Promise<UpdateProfilePictureResponse> => {
    const response = await api.put(uploadEndpoints.updateProfilePicture, {
      profilePictureUrl,
    });
    return response.data.data.user;
  },

  /**
   * Delete user's profile picture
   */
  deleteProfilePicture: async (): Promise<UpdateProfilePictureResponse> => {
    const response = await api.delete(uploadEndpoints.deleteProfilePicture);
    return response.data.data.user;
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
