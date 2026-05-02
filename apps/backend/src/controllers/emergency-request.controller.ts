import {
  emergencyRequest,
  emergencyResponse,
  requestEvents,
  serviceProvider,
  user,
} from '@repo/db/schemas';

import { HttpStatusCode } from 'axios';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { envConfig } from '@/config';
import { SocketEvents, SocketRoom } from '@/constants/socket.constants';
import db from '@/db';
import emergencyRequestService from '@/services/emergency/emergency-request.service';
import { postJsonWithRetry } from '@/services/internal-http.service';
import {
  acquireLock,
  clearEmergencyProviders,
  getEmergencyProviders,
  releaseLock,
} from '@/services/redis.service';
import { getIo } from '@/socket';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';

const handleEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const { emergencyType, emergencyDescription, userLocation } = req.body;

    const loggedInUser = req.user;

    if (!loggedInUser?.id) {
      throw ApiError.unauthorized('Unauthorized');
    }

    const { success, requestId, error, requestInfo } =
      await emergencyRequestService.create(
        loggedInUser?.id,
        {
          emergencyType,
          description: emergencyDescription,
          location: userLocation,
        },
        'inapp'
      );

    if (!success) {
      throw ApiError.badRequest(`${error}`);
    }

    res.status(201).json(
      new ApiResponse(201, 'Emergency request created', {
        emergencyRequest: requestInfo,
      })
    );
  }
);

const getEmergencyRequest = asyncHandler(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    if (!id) {
      throw ApiError.badRequest('Emergency request ID is required');
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
      throw ApiError.badRequest('User ID is required');
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
    // const { status } = req.body;

    if (!id) {
      throw ApiError.badRequest('Emergency request ID is required');
    }

    const updateData = req.body;

    if (Object.keys(updateData).length === 0) {
      throw ApiError.badRequest('No data to update');
    }

    const invalidKeys = Object.keys(updateData).filter(
      key => !Object.keys(emergencyRequest).includes(key)
    );

    if (invalidKeys.length > 0) {
      throw ApiError.badRequest(
        `Invalid data to update. Invalid keys: ${invalidKeys}`
      );
    }

    const existingEmergencyRequest = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, id),
    });

    if (!existingEmergencyRequest) {
      throw ApiError.notFound('Emergency request not found');
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
      throw ApiError.internalServerError('Error updating emergency request');
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
      throw ApiError.badRequest('User ID is required');
    }

    if (!loggedInUser.role) {
      throw ApiError.badRequest('User role is required');
    }

    if (!id) {
      throw ApiError.badRequest('Emergency request ID is required');
    }

    const existingEmergencyRequest = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, id),
    });

    if (!existingEmergencyRequest) {
      throw ApiError.notFound('Emergency request not found');
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
      throw ApiError.internalServerError('Error deleting emergency request');
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
      throw ApiError.badRequest('User ID is required');
    }

    if (!id) {
      throw ApiError.badRequest('Emergency request ID is required');
    }

    const existingEmergencyRequest = await db.query.emergencyRequest.findFirst({
      where: and(
        eq(emergencyRequest.id, id),
        eq(emergencyRequest.userId, loggedInUser.id)
      ),
    });

    if (!existingEmergencyRequest) {
      throw ApiError.notFound('Emergency request not found or not authorized');
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
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!requestId) {
      throw ApiError.badRequest('Request ID is required');
    }

    const lockAcquired = await acquireLock(requestId, providerId, 30);

    if (!lockAcquired) {
      throw ApiError.conflict('Request already taken by another provider');
    }

    try {
      const existingRequest = await db.query.emergencyRequest.findFirst({
        where: eq(emergencyRequest.id, requestId),
      });

      if (!existingRequest) {
        await releaseLock(requestId, providerId);
        throw ApiError.notFound('Emergency request not found');
      }

      if (existingRequest.requestStatus === 'assigned') {
        await releaseLock(requestId, providerId);
        throw ApiError.conflict('Request already assigned');
      }

      if (existingRequest.requestStatus === 'cancelled') {
        await releaseLock(requestId, providerId);
        throw ApiError.gone('Request was cancelled');
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
        (async () => {
          const providerData = await db.query.serviceProvider.findFirst({
            where: eq(serviceProvider.id, providerId),
          });

          return db.insert(emergencyResponse).values({
            emergencyRequestId: requestId,
            serviceProviderId: providerId,
            originLocation: {
              latitude: providerData?.currentLocation?.latitude || '0',
              longitude: providerData?.currentLocation?.longitude || '0',
            },
            destinationLocation: {
              latitude: existingRequest.location?.latitude.toString() || '0',
              longitude: existingRequest.location?.longitude.toString() || '0',
            },
            assignedAt: new Date(),
          });
        })(),
      ]);

      const providerIds = await getEmergencyProviders(requestId);
      console.log('Got providers', providerIds);

      const io = getIo();

      if (io) {
        for (const pid of providerIds) {
          console.log('pid', pid);
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

        // fetch provider details once for both local and platform emit
        const providerData = await db.query.serviceProvider.findFirst({
          where: eq(serviceProvider.id, providerId),
        });

        // Also emit locally for dev mode (when no separate platform)
        io.to(SocketRoom.USER(existingRequest.userId)).emit(
          SocketEvents.REQUEST_ACCEPTED,
          {
            requestId,
            provider: {
              id: providerId,
              name: providerData?.name,
              phone: providerData?.phoneNumber?.toString(),
              serviceType: providerData?.serviceType,
              vehicleNumber: providerData?.vehicleInformation?.number,
              location: providerData?.currentLocation,
            },
          }
        );

        // notify platform (silently, don't fail the request)
        const platformUrl = envConfig.platform_base_url;
        if (platformUrl && existingRequest.userId) {
          // Fire async - don't await
          postJsonWithRetry<{ ok: true }>(
            `${platformUrl}/api/v1/internal/incidents/${requestId}/update`,
            {
              headers: {
                'x-internal-api-key': envConfig.internal_api_key as string,
              },
              body: {
                userId: existingRequest.userId,
                eventType: SocketEvents.REQUEST_ACCEPTED,
                requestStatus: 'assigned',
                provider: {
                  id: providerId,
                  name: providerData?.name,
                  phone: providerData?.phoneNumber?.toString(),
                  serviceType: providerData?.serviceType,
                  vehicleNumber: providerData?.vehicleInformation?.number,
                  location: providerData?.currentLocation,
                },
                message: 'Provider accepted your request',
              },
              timeoutMs: 2000,
              retries: 1,
              backoffMs: 500,
            }
          ).catch(e => console.log('[ACCEPT] Platform notify failed:', e));
        }
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
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!requestId) {
      throw ApiError.badRequest('Request ID is required');
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
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!requestId) {
      throw ApiError.badRequest('Request ID is required');
    }

    const existingRequest = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, requestId),
    });

    if (!existingRequest) {
      throw ApiError.notFound('Emergency request not found');
    }

    if (existingRequest.requestStatus !== 'assigned') {
      throw ApiError.badRequest('Request is not in assigned status');
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
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!requestId) {
      throw ApiError.badRequest('Request ID is required');
    }

    const existingRequest = await db.query.emergencyRequest.findFirst({
      where: and(
        eq(emergencyRequest.id, requestId),
        eq(emergencyRequest.userId, userId)
      ),
    });

    if (!existingRequest) {
      throw ApiError.notFound('Emergency request not found or not authorized');
    }

    if (
      existingRequest.requestStatus !== 'accepted' &&
      existingRequest.requestStatus !== 'assigned'
    ) {
      throw ApiError.badRequest(
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

const providerConfirmedArrival = asyncHandler(
  async (req: Request, res: Response) => {
    const requestId = req.params.id as string;
    const providerId = req.user?.id;

    if (!providerId) {
      throw ApiError.unauthorized('Unauthorized');
    }

    if (!requestId) {
      throw ApiError.badRequest('Request ID is required');
    }

    const existingRequest = await db.query.emergencyRequest.findFirst({
      where: and(eq(emergencyRequest.id, requestId)),
    });

    if (!existingRequest) {
      throw ApiError.notFound('Emergency request not found or not authorized');
    }

    if (
      existingRequest.requestStatus !== 'accepted' &&
      existingRequest.requestStatus !== 'assigned'
    ) {
      throw ApiError.badRequest(
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
        metadata: {
          arrivedAt,
          confirmedByUser: false,
          confirmedByProvider: true,
        },
      }),
    ]);

    const io = getIo();
    if (io && response?.serviceProviderId) {
      io.to(SocketRoom.PROVIDER(response.serviceProviderId)).emit(
        SocketEvents.PROVIDER_CONFIRM_ARRIVAL,
        {
          requestId,
          arrivedAt,
          message: 'Provider has confirmed their arrival',
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
    const { page, limit, sortBy, status } = req.validatedQuery as {
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

    console.log('[RECEIVED]', req.user, req.validatedQuery, status);

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

const getProviderEmergencyHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInProvider = req.user;
    const { page, limit, sortBy, status } = req.validatedQuery as {
      page: number;
      limit: number;
      sortBy: 'asc' | 'desc';
      status?: 'completed' | 'cancelled' | 'in_progress';
    };

    const offset = (page - 1) * limit;

    const baseCondition = eq(
      emergencyResponse.serviceProviderId,
      loggedInProvider!.id
    );

    let queryConditions: ReturnType<typeof eq> = baseCondition;
    if (status) {
      queryConditions = and(
        baseCondition,
        eq(emergencyRequest.requestStatus, status)
      ) as ReturnType<typeof eq>;
    }

    const emergencyResponses = await db
      .select({
        response: emergencyResponse,
        request: emergencyRequest,
        user: user,
      })
      .from(emergencyResponse)
      .innerJoin(
        emergencyRequest,
        eq(emergencyResponse.emergencyRequestId, emergencyRequest.id)
      )
      .innerJoin(user, eq(emergencyRequest.userId, user.id))
      .where(queryConditions)
      .orderBy(
        sortBy === 'asc'
          ? emergencyResponse.respondedAt
          : desc(emergencyResponse.respondedAt)
      )
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emergencyResponse)
      .where(baseCondition);

    const [completedResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emergencyResponse)
      .innerJoin(
        emergencyRequest,
        eq(emergencyResponse.emergencyRequestId, emergencyRequest.id)
      )
      .where(
        and(
          eq(emergencyResponse.serviceProviderId, loggedInProvider!.id),
          eq(emergencyRequest.requestStatus, 'completed')
        )
      );

    const [cancelledResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(emergencyResponse)
      .innerJoin(
        emergencyRequest,
        eq(emergencyResponse.emergencyRequestId, emergencyRequest.id)
      )
      .where(
        and(
          eq(emergencyResponse.serviceProviderId, loggedInProvider!.id),
          eq(emergencyRequest.requestStatus, 'cancelled')
        )
      );

    const [avgResult] = await db
      .select({
        avgTime: sql<number>`AVG(EXTRACT(EPOCH FROM (${emergencyResponse.respondedAt} - ${emergencyRequest.createdAt})))::int`,
      })
      .from(emergencyResponse)
      .innerJoin(
        emergencyRequest,
        eq(emergencyResponse.emergencyRequestId, emergencyRequest.id)
      )
      .where(
        and(
          eq(emergencyResponse.serviceProviderId, loggedInProvider!.id),
          eq(emergencyRequest.requestStatus, 'completed'),
          sql`${emergencyResponse.respondedAt} IS NOT NULL`
        )
      );

    const totalCount = totalResult?.count ?? 0;

    const history = emergencyResponses.map(
      ({ response, request, user: userData }) => ({
        id: request.id,
        emergencyType: request.serviceType,
        emergencyDescription: request.description,
        status: request.requestStatus,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        emergencyLocation: request.location,
        responseTime:
          response.respondedAt && request.createdAt
            ? Math.floor(
                (new Date(response.respondedAt).getTime() -
                  new Date(request.createdAt).getTime()) /
                  1000
              )
            : null,
        distanceTraveled: null,
        user: userData
          ? {
              id: userData.id,
              name: userData.name,
              phoneNumber: userData.phoneNumber,
            }
          : null,
      })
    );

    const stats = {
      total: totalCount,
      completed: completedResult?.count ?? 0,
      cancelled: cancelledResult?.count ?? 0,
      avgResponseTime: avgResult?.avgTime ?? null,
    };

    return res.status(200).json(
      new ApiResponse(200, 'Provider emergency history retrieved', {
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

const controllers = {
  accept: acceptEmergencyRequest,
  cancel: cancelEmergencyRequest,
  complete: completeEmergencyRequest,
  confirmProviderArrival,
  create: handleEmergencyRequest,
  remove: deleteEmergencyRequest,
  getById: getEmergencyRequest,
  getProviderHistory: getProviderEmergencyHistory,
  getRecent: getRecentEmergencyRequests,
  getUserHistory: getUserEmergencyHistory,
  getForUser: getUsersEmergencyRequests,
  providerConfirmedArrival,
  reject: rejectEmergencyRequest,
  update: updateEmergencyRequest,
};

export default controllers;
