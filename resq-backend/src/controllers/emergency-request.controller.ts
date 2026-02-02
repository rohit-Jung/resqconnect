import { HttpStatusCode } from 'axios';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';
import { latLngToCell } from 'h3-js';

import {
  H3_RESOLUTION,
  INITIAL_SEARCH_RADIUS,
  REQUEST_TIMEOUT_MS,
} from '@/constants';
import {
  AGGREGATE_TYPES,
  KAFKA_TOPICS,
  OUTBOX_EVENT_TYPES,
} from '@/constants/kafka.constants';
import db from '@/db';
import { emergencyRequest, outbox, user } from '@/models';
import { notifyEmergencyContacts } from '@/services/notification.service';
import { emitSocketEvent } from '@/socket';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { CreateNewRequestSchema } from '@/validations/emergency-request';
import { publishWithRetry } from '@/services/kafka/kafka.utils';


const createEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const parsedValues = CreateNewRequestSchema.safeParse(req.body);

    if (!parsedValues.success) {
      return res
        .status(HttpStatusCode.BadRequest)
        .json(ApiError.validationError(parsedValues.error));
    }

    const { emergencyType, emergencyDescription, userLocation } =
      parsedValues.data;

    const loggedInUser = req.user;
    if (!loggedInUser?.id) {
      throw new ApiError(
        HttpStatusCode.Unauthorized,
        'Unauthorized access to request creation.',
      );
    }

    // Convert location to H3 index
    const h3Index = latLngToCell(
      userLocation.latitude,
      userLocation.longitude,
      H3_RESOLUTION,
    );

    const h3IndexBigInt = BigInt(`0x${h3Index}`);

    // Create PostGIS POINT geometry string
    const locationPoint = `POINT(${userLocation.longitude} ${userLocation.latitude})`;

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + REQUEST_TIMEOUT_MS);

    try {
      // Start database transaction for atomicity
      const result = await db.transaction(async tx => {
        // 1. Create emergency request
        const [newRequest] = await tx
          .insert(emergencyRequest)
          .values({
            userId: loggedInUser.id,
            serviceType: String(emergencyType).toLowerCase() as any,
            description: emergencyDescription,
            location: {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            },
            geoLocation: sql`ST_SetSRID(ST_GeomFromText(${locationPoint}), 4326)`,
            h3Index: h3IndexBigInt,
            searchRadius: INITIAL_SEARCH_RADIUS,
            expiresAt: expiresAt.toISOString(),
            requestStatus: 'pending',
          })
          .returning({
            id: emergencyRequest.id,
            userId: emergencyRequest.userId,
            emergencyType: emergencyRequest.serviceType,
            emergencyDescription: emergencyRequest.description,
            emergencyLocation: emergencyRequest.location,
            status: emergencyRequest.requestStatus,
            searchRadius: emergencyRequest.searchRadius,
            expiresAt: emergencyRequest.expiresAt,
          });

        if (!newRequest?.id) {
          throw new ApiError(500, 'Error creating emergency request');
        }

        // 2. Create outbox event for reliable Kafka publishing
        const eventPayload = {
          requestId: newRequest.id,
          userId: newRequest.userId,
          emergencyType: newRequest.emergencyType,
          emergencyDescription: newRequest.emergencyDescription,
          emergencyLocation: newRequest.emergencyLocation,
          status: newRequest.status,
          h3Index: h3Index, // Send hex string, not BigInt
          searchRadius: newRequest.searchRadius,
          expiresAt: newRequest.expiresAt,
        };

        await tx.insert(outbox).values({
          aggregateId: newRequest.id,
          aggregateType: AGGREGATE_TYPES.EMERGENCY_REQUEST,
          eventType: OUTBOX_EVENT_TYPES.CREATED,
          payload: JSON.stringify(eventPayload),
          status: 'pending',
        });

        // 3. Update user's current location
        await tx
          .update(user)
          .set({
            currentLocation: {
              latitude: userLocation.latitude.toString(),
              longitude: userLocation.longitude.toString(),
            },
          })
          .where(eq(user.id, loggedInUser.id));

        return newRequest;
      });

      // Transaction committed successfully
      // Try to publish to Kafka immediately (with retry)
      const published = await publishWithRetry(KAFKA_TOPICS.EMERGENCY_CREATED, {
        key: result.id,
        value: JSON.stringify({
          requestId: result.id,
          userId: result.userId,
          emergencyType: result.emergencyType,
          emergencyDescription: result.emergencyDescription,
          emergencyLocation: result.emergencyLocation,
          status: result.status,
          h3Index: h3Index,
          searchRadius: result.searchRadius,
          expiresAt: result.expiresAt,
        }),
      });

      if (published) {
        // Mark outbox event as published
        await db
          .update(outbox)
          .set({ status: 'published', publishedAt: new Date().toISOString() })
          .where(eq(outbox.aggregateId, result.id));
      } else {
        console.warn(
          `Kafka unavailable, event queued in outbox for request ${result.id}`,
        );
      }

      // Notify emergency contacts asynchronously (don't block response)
      // TODO: do this in the topic
      notifyEmergencyContacts({
        requestId: result.id,
        userId: result.userId,
        userName: loggedInUser.name || 'User',
        emergencyType: result.emergencyType || emergencyType,
        location: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        },
        message: emergencyDescription,
      }).catch(err => {
        console.error('Failed to notify emergency contacts:', err);
      });

      res.status(201).json(
        new ApiResponse(201, 'Emergency request created', {
          emergencyRequest: result,
        }),
      );
    } catch (error) {
      console.error('Error creating emergency request:', error);
      throw new ApiError(500, 'Failed to create emergency request');
    }
  },
);

const getEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, 'Emergency request ID is required');
    }

    const emergencyRequestData = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, id),
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, 'Emergency request found', emergencyRequestData),
      );
  },
);

const getUsersEmergencyRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser.id) {
      throw new ApiError(400, 'User ID is required');
    }

    const emergencyRequests = await db.query.emergencyRequest.findMany({
      where: eq(emergencyRequest.userId, loggedInUser.id),
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, 'Emergency requests found', emergencyRequests),
      );
  },
);

const updateEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      throw new ApiError(400, 'Emergency request ID is required');
    }

    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, 'No data to update');
    }

    const invalidKeys = Object.keys(updateData).filter(
      key => !Object.keys(emergencyRequest).includes(key),
    );

    if (invalidKeys.length > 0) {
      throw new ApiError(
        400,
        `Invalid data to update. Invalid keys: ${invalidKeys}`,
      );
    }

    const existingEmergencyRequest = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, id),
    });

    if (!existingEmergencyRequest) {
      throw new ApiError(404, 'Emergency request not found');
    }

    const updatedEmergencyRequest = await db
      .update(emergencyRequest)
      .set(updateData)
      .where(eq(emergencyRequest.id, id))
      .returning({
        id: emergencyRequest.id,
        userId: emergencyRequest.userId,
        emergencyType: emergencyRequest.serviceType,
        emergencyDescription: emergencyRequest.description,
        emergencyLocation: emergencyRequest.location,
        requestStatus: emergencyRequest.requestStatus,
      });

    if (!updatedEmergencyRequest) {
      throw new ApiError(500, 'Error updating emergency request');
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          'Emergency request updated',
          updatedEmergencyRequest,
        ),
      );
  },
);

const deleteEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser.id) {
      throw new ApiError(400, 'User ID is required');
    }

    if (!loggedInUser.role) {
      throw new ApiError(400, 'User role is required');
    }

    if (!id) {
      throw new ApiError(400, 'Emergency request ID is required');
    }

    const existingEmergencyRequest = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, id),
    });

    if (!existingEmergencyRequest) {
      throw new ApiError(404, 'Emergency request not found');
    }

    const deletedEmergencyRequest = await db
      .delete(emergencyRequest)
      .where(eq(emergencyRequest.id, id))
      .returning({
        id: emergencyRequest.id,
        patientId: emergencyRequest.userId,
        emergencyType: emergencyRequest.serviceType,
        emergencyDescription: emergencyRequest.description,
        emergencyLocation: emergencyRequest.location,
        status: emergencyRequest.requestStatus,
      });

    if (!deletedEmergencyRequest) {
      throw new ApiError(500, 'Error deleting emergency request');
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          'Emergency request deleted',
          deletedEmergencyRequest,
        ),
      );
  },
);

const getRecentEmergencyRequests = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const recentRequests = await db.query.emergencyRequest.findMany({
      where: eq(emergencyRequest.userId, userId),
      orderBy: [desc(emergencyRequest.createdAt)],
      limit: 10,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, 'Recent emergency requests', recentRequests));
  },
);

const cancelEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser.id) {
      throw new ApiError(400, 'User ID is required');
    }

    if (!id) {
      throw new ApiError(400, 'Emergency request ID is required');
    }

    const existingEmergencyRequest = await db.query.emergencyRequest.findFirst({
      where: and(
        eq(emergencyRequest.id, id),
        eq(emergencyRequest.userId, loggedInUser.id),
      ),
    });

    if (!existingEmergencyRequest) {
      throw new ApiError(404, 'Emergency request not found or not authorized');
    }

    if (existingEmergencyRequest.requestStatus === 'cancelled') {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            'Request already cancelled',
            existingEmergencyRequest,
          ),
        );
    }

    const [updatedRequest] = await db
      .update(emergencyRequest)
      .set({ requestStatus: 'cancelled' })
      .where(eq(emergencyRequest.id, id))
      .returning();

    // Optionally: emit socket event to notify providers
    // emitSocketEvent()

    return res
      .status(200)
      .json(
        new ApiResponse(200, 'Emergency request cancelled', updatedRequest),
      );
  },
);

export {
  createEmergencyRequest,
  getEmergencyRequest,
  getUsersEmergencyRequests,
  updateEmergencyRequest,
  deleteEmergencyRequest,
  getRecentEmergencyRequests,
  cancelEmergencyRequest,
};
