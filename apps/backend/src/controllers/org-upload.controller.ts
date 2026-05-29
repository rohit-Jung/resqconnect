import { organization } from '@repo/db/schemas';

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

export const getOrgUploadSignature = asyncHandler(
  async (req: Request, res: Response) => {
    const orgId = req.user?.id;

    if (!orgId) {
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!isCloudinaryConfigured()) {
      throw ApiError.serviceUnavailable(
        'Image upload service is not configured'
      );
    }

    const publicId = `org_${orgId}_${Date.now()}`;
    const signatureData = generateUploadSignature('org-logos', publicId);

    res.status(200).json(
      new ApiResponse(200, 'Upload signature generated successfully', {
        ...signatureData,
        uploadUrl: `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
      })
    );
  }
);

export const updateOrgLogo = asyncHandler(
  async (req: Request, res: Response) => {
    const orgId = req.user?.id;
    const { logoUrl } = req.body;

    if (!orgId) {
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!logoUrl || typeof logoUrl !== 'string') {
      throw ApiError.badRequest('Logo URL is required');
    }

    if (!logoUrl.includes('cloudinary.com')) {
      throw ApiError.badRequest('Invalid logo URL');
    }

    const existingOrg = await db.query.organization.findFirst({
      where: eq(organization.id, orgId),
      columns: { id: true, logo: true },
    });

    if (!existingOrg) {
      throw ApiError.notFound('Organization not found');
    }

    if (existingOrg.logo) {
      const oldPublicId = extractPublicIdFromUrl(existingOrg.logo);
      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    const updated = await db
      .update(organization)
      .set({ logo: logoUrl })
      .where(eq(organization.id, orgId))
      .returning({
        id: organization.id,
        name: organization.name,
        email: organization.email,
        logo: organization.logo,
      });

    if (!updated.length) {
      throw ApiError.internalServerError('Failed to update logo');
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, 'Logo updated successfully', {
          organization: updated[0],
        })
      );
  }
);

export const deleteOrgLogo = asyncHandler(
  async (req: Request, res: Response) => {
    const orgId = req.user?.id;

    if (!orgId) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const existingOrg = await db.query.organization.findFirst({
      where: eq(organization.id, orgId),
      columns: { id: true, logo: true },
    });

    if (!existingOrg) {
      throw ApiError.notFound('Organization not found');
    }

    if (!existingOrg.logo) {
      throw ApiError.badRequest('No logo to delete');
    }

    const publicId = extractPublicIdFromUrl(existingOrg.logo);
    if (publicId) {
      await deleteImage(publicId);
    }

    const updated = await db
      .update(organization)
      .set({ logo: null })
      .where(eq(organization.id, orgId))
      .returning({
        id: organization.id,
        name: organization.name,
        email: organization.email,
        logo: organization.logo,
      });

    if (!updated.length) {
      throw ApiError.internalServerError('Failed to delete logo');
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, 'Logo deleted successfully', {
          organization: updated[0],
        })
      );
  }
);

const orgUploadController = {
  getSignature: getOrgUploadSignature,
  updateLogo: updateOrgLogo,
  deleteLogo: deleteOrgLogo,
} as const;

export default orgUploadController;
