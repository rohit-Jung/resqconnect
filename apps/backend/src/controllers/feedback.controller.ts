import { feedback } from '@repo/db/schemas';

import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';

import db from '@/db';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';

const createFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { serviceProviderId, message, serviceRatings } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw ApiError.unauthorized('Unauthorized to perform this action');
  }

  if (!serviceProviderId || !message || !serviceRatings) {
    throw ApiError.badRequest('Missing required fields');
  }

  const createdFeedback = await db
    .insert(feedback)
    .values({
      userId,
      serviceProviderId,
      message,
      serviceRatings,
    })
    .returning({
      id: feedback.id,
      userId: feedback.userId,
      serviceProviderId: feedback.serviceProviderId,
      message: feedback.message,
      serviceRatings: feedback.serviceRatings,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    });

  if (!createdFeedback || createdFeedback.length === 0) {
    throw ApiError.internalServerError('Failed to create feedback');
  }

  res.status(201).json(
    new ApiResponse(201, 'Feedback created', {
      feedback: createdFeedback[0],
    })
  );
});

const updateFeedback = asyncHandler(async (req: Request, res: Response) => {
  const rawId = (req.params as any)?.id as unknown;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const userId = req.user?.id;

  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Feedback ID is required');
  }

  if (!userId) {
    throw ApiError.unauthorized('Unauthorized to perform this action');
  }

  const existingFeedback = await db.query.feedback.findFirst({
    where: eq(feedback.id, id),
  });

  if (!existingFeedback) {
    throw ApiError.notFound('Feedback not found');
  }

  if (existingFeedback?.userId !== userId) {
    throw ApiError.unauthorized('Unauthorized to perform this action');
  }

  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    throw ApiError.badRequest('No data to update');
  }

  const invalidKeys = Object.keys(updateData).filter(
    key => !Object.keys(feedback).includes(key)
  );

  if (invalidKeys.length > 0) {
    throw ApiError.badRequest(
      `Invalid data to update. Invalid keys: ${invalidKeys}`
    );
  }

  const updatedFeedback = await db
    .update(feedback)
    .set(updateData)
    .where(eq(feedback.id, id))
    .returning();

  if (!updatedFeedback) {
    throw ApiError.internalServerError('Failed to update feedback');
  }

  res.status(200).json(
    new ApiResponse(200, 'Feedback updated', {
      feedback: updatedFeedback[0],
    })
  );
});

const deleteFeedback = asyncHandler(async (req: Request, res: Response) => {
  const rawId = (req.params as any)?.id as unknown;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const userId = req.user?.id;
  const role = req.user?.role;

  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Feedback ID is required');
  }

  if (!userId) {
    throw ApiError.unauthorized('Unauthorized to perform this action');
  }

  const existingFeedback = await db.query.feedback.findFirst({
    where: eq(feedback.id, id),
  });

  if (!existingFeedback) {
    throw ApiError.notFound('Feedback not found');
  }

  if (role !== 'admin' && existingFeedback?.userId !== userId) {
    throw ApiError.unauthorized('Unauthorized to perform this action');
  }

  const deletedFeedback = await db
    .delete(feedback)
    .where(eq(feedback.id, id))
    .returning();

  if (!deletedFeedback) {
    throw ApiError.internalServerError('Failed to delete feedback');
  }

  res.status(200).json(
    new ApiResponse(200, 'Feedback deleted', {
      feedback: deletedFeedback[0],
    })
  );
});

const getFeedback = asyncHandler(async (req: Request, res: Response) => {
  const rawId = (req.params as any)?.id as unknown;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || typeof id !== 'string') {
    throw ApiError.badRequest('Feedback ID is required');
  }

  const existingFeedback = await db.query.feedback.findFirst({
    where: eq(feedback.id, id),
  });

  if (!existingFeedback) {
    throw ApiError.notFound('Feedback not found');
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Feedback found', existingFeedback));
});

const getUsersFeedback = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    throw ApiError.unauthorized('Unauthorized to perform this action');
  }

  const feedbacks = await db.query.feedback.findMany({
    where: eq(feedback.userId, loggedInUser.id),
  });

  res.status(200).json(new ApiResponse(200, 'Feedbacks found', feedbacks));
});

const feedbackController = {
  create: createFeedback,
  update: updateFeedback,
  remove: deleteFeedback,
  getById: getFeedback,
  getForUser: getUsersFeedback,
} as const;

export default feedbackController;

export {
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getFeedback,
  getUsersFeedback,
};
