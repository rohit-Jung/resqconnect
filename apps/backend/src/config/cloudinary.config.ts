import { v2 as cloudinary } from 'cloudinary';

import { envConfig } from './env.config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: envConfig.cloudinary_cloud_name,
  api_key: envConfig.cloudinary_api_key,
  api_secret: envConfig.cloudinary_api_secret,
});

export function isCloudinaryConfigured(): boolean {
  return !!(
    envConfig.cloudinary_cloud_name &&
    envConfig.cloudinary_api_key &&
    envConfig.cloudinary_api_secret
  );
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

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    envConfig.cloudinary_api_secret!
  );

  return {
    signature,
    timestamp,
    cloudName: envConfig.cloudinary_cloud_name!,
    apiKey: envConfig.cloudinary_api_key!,
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
