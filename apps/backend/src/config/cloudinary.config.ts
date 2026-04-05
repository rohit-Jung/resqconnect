import { v2 as cloudinary } from 'cloudinary';
import type { Request } from 'express';
import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

import { envConfig } from './env.config';

cloudinary.config({
  cloud_name: envConfig.cloudinary_cloud_name,
  api_key: envConfig.cloudinary_api_key,
  api_secret: envConfig.cloudinary_api_secret,
});

const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'document-verification',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    public_id: (_req: Request, file: Express.Multer.File) => {
      const timestamp = Date.now();
      const fieldName = file.fieldname;
      return `${fieldName}-${timestamp}`;
    },
  } as any,
});

export const uploadDocuments = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed'));
    }
  },
}).fields([
  { name: 'panCard', maxCount: 1 },
  { name: 'citizenship', maxCount: 1 },
]);

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
