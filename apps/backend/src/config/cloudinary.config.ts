import { v2 as cloudinary } from 'cloudinary';

import { envConfig } from '@/config';

const cloudName =
  typeof envConfig.cloudinary_cloud_name === 'string'
    ? envConfig.cloudinary_cloud_name
    : undefined;
const apiKey =
  typeof envConfig.cloudinary_api_key === 'string'
    ? envConfig.cloudinary_api_key
    : undefined;
const apiSecret =
  typeof envConfig.cloudinary_api_secret === 'string'
    ? envConfig.cloudinary_api_secret
    : undefined;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export function isCloudinaryConfigured(): boolean {
  return !!(cloudName && apiKey && apiSecret);
}

export function generateUploadSignature(
  folder: string = 'profile-pictures',
  publicId?: string
): {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
  publicId?: string;
} {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const paramsToSign: Record<string, string | number> = {
    timestamp,
    folder,
  };

  if (publicId) {
    paramsToSign.public_id = publicId;
  }

  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret!);

  return {
    signature,
    timestamp,
    cloudName: cloudName!,
    apiKey: apiKey!,
    folder,
    publicId,
  };
}

export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
}

export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Cloudinary URLs follow pattern: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{public_id}.{format}
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.\w+$/;
    const match = url.match(regex);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

export default cloudinary;
