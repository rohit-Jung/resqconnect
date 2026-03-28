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
  EVENT_TYPES,
  KAFKA_TOPICS,
  OUTBOX_EVENT_TYPES,
} from '@/constants/kafka.constants';
import { SocketEvents, SocketRoom } from '@/constants/socket.constants';
import db from '@/db';
import {
  emergencyRequest,
  emergencyResponse,
  outbox,
  requestEvents,
  serviceProvider,
  user,
} from '@/models';
import { publishWithRetry } from '@/services/kafka/kafka.utils';
import {
  acquireLock,
  clearEmergencyProviders,
  getEmergencyProviders,
  releaseLock,
} from '@/services/redis.service';
import { getIo } from '@/socket';
import { getKafkaTopic } from '@/utils';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';

const createEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { emergencyType, emergencyDescription, userLocation } = req.body;
    const loggedInUser = req.user;

    const h3Index = latLngToCell(
      userLocation.latitude,
      userLocation.longitude,
      H3_RESOLUTION
    );

    const h3IndexBigInt = BigInt(`0x${h3Index}`);
    const locationPoint = `POINT(${userLocation.longitude} ${userLocation.latitude})`;
    const expiresAt = new Date(Date.now() + REQUEST_TIMEOUT_MS);

    try {
      const result = await db.transaction(async tx => {
        const [newRequest] = await tx
          .insert(emergencyRequest)
          .values({
            userId: loggedInUser!.id,
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

        const eventPayload = {
          requestId: newRequest.id,
          userId: newRequest.userId,
          emergencyType: newRequest.emergencyType,
          emergencyDescription: newRequest.emergencyDescription,
          emergencyLocation: newRequest.emergencyLocation,
          status: newRequest.status,
          h3Index: h3Index,
          searchRadius: newRequest.searchRadius,
          expiresAt: newRequest.expiresAt,
        };

        await tx.insert(outbox).values({
          aggregateId: newRequest.id,
          aggregateType: AGGREGATE_TYPES.EMERGENCY_REQUEST,
          eventType: OUTBOX_EVENT_TYPES.CREATED,
          kafkaTopic: getKafkaTopic(emergencyType),
          payload: JSON.stringify(eventPayload),
          status: 'pending',
        });

        await tx
          .update(user)
          .set({
            currentLocation: {
              latitude: userLocation.latitude.toString(),
              longitude: userLocation.longitude.toString(),
            },
          })
          .where(eq(user.id, loggedInUser!.id));

        return newRequest;
      });

      const published = await publishWithRetry(KAFKA_TOPICS.MEDICAL_EVENTS, {
        key: result.id,
        value: JSON.stringify({
          type: EVENT_TYPES.REQUEST_CREATED,
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
        await db
          .update(outbox)
          .set({ status: 'published', publishedAt: new Date().toISOString() })
          .where(eq(outbox.aggregateId, result.id));
      } else {
        console.warn(
          `Kafka unavailable, event queued in outbox for request ${result.id}`
        );
      }

      res.status(201).json(
        new ApiResponse(201, 'Emergency request created', {
          emergencyRequest: result,
        })
      );
    } catch (error) {
      console.error('Error creating emergency request:', error);
      throw new ApiError(500, 'Failed to create emergency request');
    }
  }
);

const getEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    if (!id) {
      throw new ApiError(400, 'Emergency request ID is required');
    }

    const emergencyRequestData = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, id),
    });

    return res
      .status(200)
      .json(
        new ApiResponse(200, 'Emergency request found', emergencyRequestData)
      );
  }
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
        new ApiResponse(200, 'Emergency requests found', emergencyRequests)
      );
  }
);

const updateEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!id) {
      throw new ApiError(400, 'Emergency request ID is required');
    }

    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, 'No data to update');
    }

    const invalidKeys = Object.keys(updateData).filter(
      key => !Object.keys(emergencyRequest).includes(key)
    );

    if (invalidKeys.length > 0) {
      throw new ApiError(
        400,
        `Invalid data to update. Invalid keys: ${invalidKeys}`
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
          updatedEmergencyRequest
        )
      );
  }
);

const deleteEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
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
          deletedEmergencyRequest
        )
      );
  }
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
  }
);

const cancelEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
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
        eq(emergencyRequest.userId, loggedInUser.id)
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
            existingEmergencyRequest
          )
        );
    }

    const [updatedRequest] = await db
      .update(emergencyRequest)
      .set({ requestStatus: 'cancelled' })
      .where(eq(emergencyRequest.id, id))
      .returning();

    try {
      const io = getIo();

      if (io) {
        io.to(SocketRoom.EMERGENCY(id)).emit(SocketEvents.REQUEST_CANCELLED, {
          requestId: id,
          message: 'The user has cancelled this emergency request.',
        });

        let providerIds = await getEmergencyProviders(id);

        if (providerIds.length === 0) {
          const assignedResponse = await db.query.emergencyResponse.findFirst({
            where: eq(emergencyResponse.emergencyRequestId, id),
          });

          if (assignedResponse?.serviceProviderId) {
            providerIds = [assignedResponse.serviceProviderId];
          }
        }

        if (providerIds.length > 0) {
          for (const providerId of providerIds) {
            io.to(SocketRoom.PROVIDER(providerId)).emit(
              SocketEvents.REQUEST_CANCELLED,
              {
                requestId: id,
                message: 'The user has cancelled this emergency request.',
              }
            );
          }
        }
      }

      await clearEmergencyProviders(id);
    } catch (error) {
      console.error('Error notifying providers about cancellation:', error);
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, 'Emergency request cancelled', updatedRequest)
      );
  }
);

const acceptEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const requestId = req.params.id as string;
    const providerId = req.user?.id;

    if (!providerId) {
      throw new ApiError(HttpStatusCode.Unauthorized, 'Unauthorized');
    }

    if (!requestId) {
      throw new ApiError(HttpStatusCode.BadRequest, 'Request ID is required');
    }

    const lockAcquired = await acquireLock(requestId, providerId, 30);

    if (!lockAcquired) {
      throw new ApiError(
        HttpStatusCode.Conflict,
        'Request already taken by another provider'
      );
    }

    try {
      const existingRequest = await db.query.emergencyRequest.findFirst({
        where: eq(emergencyRequest.id, requestId),
      });

      if (!existingRequest) {
        await releaseLock(requestId, providerId);
        throw new ApiError(
          HttpStatusCode.NotFound,
          'Emergency request not found'
        );
      }

      if (existingRequest.requestStatus === 'assigned') {
        await releaseLock(requestId, providerId);
        throw new ApiError(HttpStatusCode.Conflict, 'Request already assigned');
      }

      if (existingRequest.requestStatus === 'cancelled') {
        await releaseLock(requestId, providerId);
        throw new ApiError(HttpStatusCode.Gone, 'Request was cancelled');
      }

      await Promise.all([
        db
          .update(emergencyRequest)
          .set({ requestStatus: 'assigned' })
          .where(eq(emergencyRequest.id, requestId)),
        db
          .update(serviceProvider)
          .set({ serviceStatus: 'assigned' })
          .where(eq(serviceProvider.id, providerId)),
        db.insert(requestEvents).values({
          requestId,
          eventType: 'accepted',
          providerId,
          metadata: { acceptedAt: new Date().toISOString() },
        }),
      ]);

      const providerIds = await getEmergencyProviders(requestId);
      const io = getIo();

      if (io) {
        for (const pid of providerIds) {
          if (pid !== providerId) {
            io.to(SocketRoom.PROVIDER(pid)).emit(
              SocketEvents.REQUEST_ALREADY_TAKEN,
              {
                requestId,
                takenBy: providerId,
              }
            );
          }
        }

        io.to(SocketRoom.USER(existingRequest.userId)).emit(
          SocketEvents.REQUEST_ACCEPTED,
          {
            requestId,
            providerId,
          }
        );

        io.emit(SocketEvents.PROVIDER_DECISION, {
          requestId,
          providerId,
          decision: 'ACCEPTED',
        });

        io.in(SocketRoom.PROVIDER(providerId)).socketsJoin(
          SocketRoom.EMERGENCY(requestId)
        );
        io.in(SocketRoom.USER(existingRequest.userId)).socketsJoin(
          SocketRoom.EMERGENCY(requestId)
        );
      }

      await clearEmergencyProviders(requestId);
      await releaseLock(requestId, providerId);

      return res.status(200).json(
        new ApiResponse(200, 'Request accepted successfully', {
          requestId,
          userId: existingRequest.userId,
          serviceType: existingRequest.serviceType,
          location: existingRequest.location,
          description: existingRequest.description,
        })
      );
    } catch (error) {
      await releaseLock(requestId, providerId);
      throw error;
    }
  }
);

const rejectEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const requestId = req.params.id as string;
    const providerId = req.user?.id;
    const { reason } = req.body;

    if (!providerId) {
      throw new ApiError(HttpStatusCode.Unauthorized, 'Unauthorized');
    }

    if (!requestId) {
      throw new ApiError(HttpStatusCode.BadRequest, 'Request ID is required');
    }

    await db.insert(requestEvents).values({
      requestId,
      eventType: 'rejected',
      providerId,
      metadata: {
        reason: reason ?? 'No reason provided',
        rejectedAt: new Date().toISOString(),
      },
    });

    const io = getIo();
    if (io) {
      io.emit(SocketEvents.PROVIDER_DECISION, {
        requestId,
        providerId,
        decision: 'REJECTED',
      });
    }

    return res.status(200).json(new ApiResponse(200, 'Request rejected', null));
  }
);

const completeEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const requestId = req.params.id as string;
    const providerId = req.user?.id;

    if (!providerId) {
      throw new ApiError(HttpStatusCode.Unauthorized, 'Unauthorized');
    }

    if (!requestId) {
      throw new ApiError(HttpStatusCode.BadRequest, 'Request ID is required');
    }

    const existingRequest = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, requestId),
    });

    if (!existingRequest) {
      throw new ApiError(
        HttpStatusCode.NotFound,
        'Emergency request not found'
      );
    }

    if (existingRequest.requestStatus !== 'assigned') {
      throw new ApiError(
        HttpStatusCode.BadRequest,
        'Request is not in assigned status'
      );
    }

    await Promise.all([
      db
        .update(emergencyRequest)
        .set({ requestStatus: 'completed' })
        .where(eq(emergencyRequest.id, requestId)),
      db
        .update(serviceProvider)
        .set({ serviceStatus: 'available' })
        .where(eq(serviceProvider.id, providerId)),
      db.insert(requestEvents).values({
        requestId,
        eventType: 'completed',
        providerId,
        metadata: { completedAt: new Date().toISOString() },
      }),
    ]);

    const io = getIo();
    if (io) {
      io.to(SocketRoom.USER(existingRequest.userId)).emit(
        SocketEvents.REQUEST_COMPLETED,
        {
          requestId,
          completedAt: new Date().toISOString(),
        }
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, 'Request completed successfully', null));
  }
);

const confirmProviderArrival = asyncHandler(
  async (req: Request, res: Response) => {
    const requestId = req.params.id as string;
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(HttpStatusCode.Unauthorized, 'Unauthorized');
    }

    if (!requestId) {
      throw new ApiError(HttpStatusCode.BadRequest, 'Request ID is required');
    }

    const existingRequest = await db.query.emergencyRequest.findFirst({
      where: and(
        eq(emergencyRequest.id, requestId),
        eq(emergencyRequest.userId, userId)
      ),
    });

    if (!existingRequest) {
      throw new ApiError(
        HttpStatusCode.NotFound,
        'Emergency request not found or not authorized'
      );
    }

    if (
      existingRequest.requestStatus !== 'accepted' &&
      existingRequest.requestStatus !== 'assigned'
    ) {
      throw new ApiError(
        HttpStatusCode.BadRequest,
        'Request is not in accepted or assigned status'
      );
    }

    const response = await db.query.emergencyResponse.findFirst({
      where: eq(emergencyResponse.emergencyRequestId, requestId),
    });

    const arrivedAt = new Date().toISOString();

    await Promise.all([
      db
        .update(emergencyRequest)
        .set({ requestStatus: 'in_progress' })
        .where(eq(emergencyRequest.id, requestId)),
      db.insert(requestEvents).values({
        requestId,
        eventType: 'in_progress',
        metadata: { arrivedAt, confirmedByUser: true },
      }),
    ]);

    const io = getIo();
    if (io && response?.serviceProviderId) {
      io.to(SocketRoom.PROVIDER(response.serviceProviderId)).emit(
        SocketEvents.PROVIDER_ARRIVAL_CONFIRMED,
        {
          requestId,
          arrivedAt,
          message: 'User has confirmed your arrival',
        }
      );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, 'Provider arrival confirmed', { arrivedAt }));
  }
);

const getUserEmergencyHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;
    const { page, limit, sortBy, status } = (req as any).validatedQuery as {
      page: number;
      limit: number;
      sortBy: 'asc' | 'desc';
      status?:
        | 'pending'
        | 'accepted'
        | 'assigned'
        | 'rejected'
        | 'in_progress'
        | 'completed'
        | 'cancelled'
        | 'no_providers_available';
    };

    const offset = (page - 1) * limit;

    const whereConditions = status
      ? and(
          eq(emergencyRequest.userId, loggedInUser!.id),
          eq(emergencyRequest.requestStatus, status)
        )
      : eq(emergencyRequest.userId, loggedInUser!.id);

    const emergencyRequests = await db.query.emergencyRequest.findMany({
      where: whereConditions,
      orderBy:
        sortBy === 'asc'
          ? emergencyRequest.createdAt
          : desc(emergencyRequest.createdAt),
      limit: limit,
      offset: offset,
    });

    const [totalCountResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emergencyRequest)
      .where(whereConditions);

    const totalCount = totalCountResult?.count ?? 0;

    const [[completedResult], [cancelledResult]] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(emergencyRequest)
        .where(
          and(
            eq(emergencyRequest.userId, loggedInUser!.id),
            eq(emergencyRequest.requestStatus, 'completed')
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(emergencyRequest)
        .where(
          and(
            eq(emergencyRequest.userId, loggedInUser!.id),
            eq(emergencyRequest.requestStatus, 'cancelled')
          )
        ),
    ]);

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emergencyRequest)
      .where(eq(emergencyRequest.userId, loggedInUser!.id));

    const history = emergencyRequests.map(request => ({
      id: request.id,
      emergencyType: request.serviceType,
      emergencyDescription: request.description,
      status: request.requestStatus,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      emergencyLocation: request.location,
    }));

    const stats = {
      total: totalResult?.count ?? 0,
      completed: completedResult?.count ?? 0,
      cancelled: cancelledResult?.count ?? 0,
    };

    return res.status(200).json(
      new ApiResponse(200, 'User emergency history retrieved', {
        history,
        stats,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      })
    );
  }
);

export {
  createEmergencyRequest,
  getEmergencyRequest,
  getUsersEmergencyRequests,
  updateEmergencyRequest,
  deleteEmergencyRequest,
  getRecentEmergencyRequests,
  cancelEmergencyRequest,
  acceptEmergencyRequest,
  rejectEmergencyRequest,
  completeEmergencyRequest,
  confirmProviderArrival,
  getUserEmergencyHistory,
};
