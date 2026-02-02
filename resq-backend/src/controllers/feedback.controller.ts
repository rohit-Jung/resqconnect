import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';

import db from '@/db';
import { feedback } from '@/models';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';

const createFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { serviceProviderId, message, serviceRatings } = req.body;
  const { id } = req.user;

  if (!id) {
    throw new ApiError(401, 'Unauthorized to perform this action');
  }

  if (!serviceProviderId || !message || !serviceRatings) {
    throw new ApiError(400, 'Missing required fields');
  }

  const createdFeedback = await db
    .insert(feedback)
    .values({
      userId: id,
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
    throw new ApiError(500, 'Failed to create feedback');
  }

  res.status(201).json(
    new ApiResponse(201, 'Feedback created', {
      feedback: createdFeedback[0],
    })
  );
});

const updateFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const { id: userId } = req.user;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized to perform this action');
  }

  const existingFeedback = await db.query.feedback.findFirst({
    where: eq(feedback.id, id),
  });

  if (!existingFeedback) {
    throw new ApiError(404, 'Feedback not found');
  }

  if (existingFeedback?.userId !== userId) {
    throw new ApiError(401, 'Unauthorized to perform this action');
  }

  const updateData = req.body;

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, 'No data to update');
  }

  const invalidKeys = Object.keys(updateData).filter(key => !Object.keys(feedback).includes(key));

  if (invalidKeys.length > 0) {
    throw new ApiError(400, `Invalid data to update. Invalid keys: ${invalidKeys}`);
  }

  const updatedFeedback = await db
    .update(feedback)
    .set(updateData)
    .where(eq(feedback.id, id))
    .returning();

  if (!updatedFeedback) {
    throw new ApiError(500, 'Failed to update feedback');
  }

  res.status(200).json(
    new ApiResponse(200, 'Feedback updated', {
      feedback: updatedFeedback[0],
    })
  );
});

const deleteFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id: userId, role } = req.user;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized to perform this action');
  }

  const existingFeedback = await db.query.feedback.findFirst({
    where: eq(feedback.id, id),
  });

  if (!existingFeedback) {
    throw new ApiError(404, 'Feedback not found');
  }

  if (role !== 'admin' && existingFeedback?.userId !== userId) {
    throw new ApiError(401, 'Unauthorized to perform this action');
  }

  const deletedFeedback = await db.delete(feedback).where(eq(feedback.id, id)).returning();

  if (!deletedFeedback) {
    throw new ApiError(500, 'Failed to delete feedback');
  }

  res.status(200).json(
    new ApiResponse(200, 'Feedback deleted', {
      feedback: deletedFeedback[0],
    })
  );
});

const getFeedback = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const existingFeedback = await db.query.feedback.findFirst({
    where: eq(feedback.id, id),
  });

  if (!existingFeedback) {
    throw new ApiError(404, 'Feedback not found');
  }

  res.status(200).json(new ApiResponse(200, 'Feedback found', existingFeedback));
});

const getUsersFeedback = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    throw new ApiError(401, 'Unauthorized to perform this action');
  }

  const feedbacks = await db.query.feedback.findMany({
    where: eq(feedback.userId, loggedInUser.id),
  });

  res.status(200).json(new ApiResponse(200, 'Feedbacks found', feedbacks));
});

export { createFeedback, updateFeedback, deleteFeedback, getFeedback, getUsersFeedback };
