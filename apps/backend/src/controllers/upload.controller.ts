import { user } from '@repo/db/schemas';

import { HttpStatusCode } from 'axios';
import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

import {
  deleteImage,
  extractPublicIdFromUrl,
  generateUploadSignature,
  isCloudinaryConfigured,
} from '@/config/cloudinary.config';
import db from '@/db';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';

export const getUploadSignature = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!isCloudinaryConfigured()) {
      throw ApiError.serviceUnavailable(
        'Image upload service is not configured'
      );
    }

    // Use userId as part of the public_id to ensure uniqueness
    const publicId = `user_${userId}_${Date.now()}`;
    const signatureData = generateUploadSignature('profile-pictures', publicId);

    res.status(200).json(
      new ApiResponse(200, 'Upload signature generated successfully', {
        ...signatureData,
        uploadUrl: `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
      })
    );
  }
);

export const updateProfilePicture = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { profilePictureUrl } = req.body;

    if (!userId) {
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!profilePictureUrl || typeof profilePictureUrl !== 'string') {
      throw ApiError.badRequest('Profile picture URL is required');
    }

    // Validate that the URL is a Cloudinary URL
    if (!profilePictureUrl.includes('cloudinary.com')) {
      throw ApiError.badRequest('Invalid profile picture URL');
    }

    // Get the current user to check for existing profile picture
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        profilePicture: true,
      },
    });

    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }

    // Delete old profile picture from Cloudinary if it exists
    if (existingUser.profilePicture) {
      const oldPublicId = extractPublicIdFromUrl(existingUser.profilePicture);
      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    const updatedUser = await db
      .update(user)
      .set({ profilePicture: profilePictureUrl })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
      });

    if (!updatedUser.length) {
      throw ApiError.internalServerError('Failed to update profile picture');
    }

    res.status(200).json(
      new ApiResponse(200, 'Profile picture updated successfully', {
        user: updatedUser[0],
      })
    );
  }
);

export const deleteProfilePicture = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized('Unauthorized');
    }

    // Get the current user
    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: {
        id: true,
        profilePicture: true,
      },
    });

    if (!existingUser) {
      throw ApiError.notFound('User not found');
    }

    if (!existingUser.profilePicture) {
      throw ApiError.badRequest('No profile picture to delete');
    }

    // Delete from Cloudinary
    const publicId = extractPublicIdFromUrl(existingUser.profilePicture);
    if (publicId) {
      await deleteImage(publicId);
    }

    // Update user's profile picture to null
    const updatedUser = await db
      .update(user)
      .set({ profilePicture: null })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
      });

    if (!updatedUser.length) {
      throw ApiError.internalServerError('Failed to delete profile picture');
    }

    res.status(200).json(
      new ApiResponse(200, 'Profile picture deleted successfully', {
        user: updatedUser[0],
      })
    );
  }
);

const uploadController = {
  getSignature: getUploadSignature,
  updateProfilePicture,
  deleteProfilePicture,
} as const;

export default uploadController;
