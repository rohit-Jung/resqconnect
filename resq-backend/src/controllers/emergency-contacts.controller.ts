import { desc, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

import db from '@/db';
import { emergencyContact, newEmergencyContactSchema } from '@/models';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';

const createEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = req.user;

  if (!userId) throw new ApiError(401, 'Unauthorized to perform this action');

  const parsedData = newEmergencyContactSchema.safeParse(req.body);
  if (!parsedData.success) {
    throw new ApiError(
      400,
      'Validation error',
      parsedData.error.issues.map(i => i.message)
    );
  }

  const { name, phoneNumber, relationship, email, notifyOnEmergency, notificationMethod } =
    parsedData.data;

  const newContact = await db
    .insert(emergencyContact)
    .values({
      name,
      phoneNumber,
      relationship,
      email,
      notifyOnEmergency: notifyOnEmergency ?? true,
      notificationMethod: notificationMethod ?? 'sms',
      isCommanContact: false,
      userId,
    })
    .returning();

  res.status(201).json(new ApiResponse(201, 'Emergency contact created', newContact[0]));
});

const updateEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { id: userId } = req.user;
  const updateData = req.body;

  if (!userId) throw new ApiError(401, 'Unauthorized');
  if (!id) throw new ApiError(400, 'Contact ID is required');

  const existing = await db.query.emergencyContact.findFirst({
    where: eq(emergencyContact.id, id),
  });

  if (!existing) throw new ApiError(404, 'Contact not found');
  if (existing.userId !== userId) throw new ApiError(403, 'Forbidden');

  const allowedFields = [
    'name',
    'phoneNumber',
    'relationship',
    'email',
    'notifyOnEmergency',
    'notificationMethod',
    'pushToken',
    'isCommanContact',
  ];
  const invalidKeys = Object.keys(updateData).filter(key => !allowedFields.includes(key));

  if (invalidKeys.length > 0) {
    throw new ApiError(400, `Invalid fields: ${invalidKeys.join(', ')}`);
  }

  // Validate notification method if provided
  if (updateData.notificationMethod) {
    const validMethods = ['sms', 'push', 'both'];
    if (!validMethods.includes(updateData.notificationMethod)) {
      throw new ApiError(
        400,
        `Invalid notification method. Must be one of: ${validMethods.join(', ')}`
      );
    }
  }

  const updated = await db
    .update(emergencyContact)
    .set({ ...updateData, updatedAt: new Date().toISOString() })
    .where(eq(emergencyContact.id, id))
    .returning();

  res.status(200).json(new ApiResponse(200, 'Emergency contact updated', updated[0]));
});

const deleteEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { id: userId, role } = req.user;

  if (!id) throw new ApiError(400, 'Contact ID is required');

  const contact = await db.query.emergencyContact.findFirst({
    where: eq(emergencyContact.id, id),
  });

  if (!contact) throw new ApiError(404, 'Contact not found');
  if (role !== 'admin' && contact.userId !== userId) {
    throw new ApiError(403, 'Unauthorized to delete this contact');
  }

  const deleted = await db.delete(emergencyContact).where(eq(emergencyContact.id, id)).returning();

  res.status(200).json(new ApiResponse(200, 'Emergency contact deleted', deleted[0]));
});

const getEmergencyContact = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id) throw new ApiError(400, 'Contact ID is required');

  const contact = await db.query.emergencyContact.findFirst({
    where: eq(emergencyContact.id, id),
  });

  if (!contact) throw new ApiError(404, 'Contact not found');

  res.status(200).json(new ApiResponse(200, 'Emergency contact found', contact));
});

const getUserEmergencyContacts = asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = req.user;

  if (!userId) throw new ApiError(401, 'Unauthorized');

  const contacts = await db
    .select()
    .from(emergencyContact)
    .where(eq(emergencyContact.userId, userId))
    .orderBy(desc(emergencyContact.createdAt));

  res.status(200).json(new ApiResponse(200, 'Contacts retrieved', contacts));
});

const getCommonEmergencyContacts = asyncHandler(async (req: Request, res: Response) => {
  const contacts = await db
    .select()
    .from(emergencyContact)
    .where(eq(emergencyContact.isCommanContact, true))
    .orderBy(desc(emergencyContact.createdAt));

  res.status(200).json(new ApiResponse(200, 'Common contacts retrieved', contacts));
});

/**
 * Toggle notification setting for a specific contact
 */
const toggleContactNotification = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { id: userId } = req.user;

  if (!userId) throw new ApiError(401, 'Unauthorized');
  if (!id) throw new ApiError(400, 'Contact ID is required');

  const contact = await db.query.emergencyContact.findFirst({
    where: eq(emergencyContact.id, id),
  });

  if (!contact) throw new ApiError(404, 'Contact not found');
  if (contact.userId !== userId) throw new ApiError(403, 'Forbidden');

  const updated = await db
    .update(emergencyContact)
    .set({
      notifyOnEmergency: !contact.notifyOnEmergency,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(emergencyContact.id, id))
    .returning();

  res.status(200).json(new ApiResponse(200, 'Contact notification toggled', updated[0]));
});

/**
 * Update push token for an emergency contact (if they have the app)
 */
const updateContactPushToken = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;
  const { pushToken } = req.body;
  const { id: userId } = req.user;

  if (!userId) throw new ApiError(401, 'Unauthorized');
  if (!id) throw new ApiError(400, 'Contact ID is required');
  if (!pushToken) throw new ApiError(400, 'Push token is required');

  const contact = await db.query.emergencyContact.findFirst({
    where: eq(emergencyContact.id, id),
  });

  if (!contact) throw new ApiError(404, 'Contact not found');
  if (contact.userId !== userId) throw new ApiError(403, 'Forbidden');

  const updated = await db
    .update(emergencyContact)
    .set({
      pushToken,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(emergencyContact.id, id))
    .returning();

  res.status(200).json(new ApiResponse(200, 'Contact push token updated', updated[0]));
});

export {
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  getEmergencyContact,
  getUserEmergencyContacts,
  getCommonEmergencyContacts,
  toggleContactNotification,
  updateContactPushToken,
};
