import { and, eq } from 'drizzle-orm';
import type { Server, Socket } from 'socket.io';

import { logger } from '@/config/logger/winston.config';
import { MUST_CONNECT_TIMEOUT_MS } from '@/constants';
import { SocketEvents, SocketRoom } from '@/constants/socket.constants';
import db from '@/db';
import {
  emergencyRequest,
  emergencyResponse,
  requestEvents,
  serviceProvider,
} from '@/models';
import { getRouteFromMapbox } from '@/services/mapbox.service';
import {
  acquireLock,
  cacheProviderLocation,
  getEmergencyProviders,
  releaseLock,
} from '@/services/redis.service';
import type { TEntityRole } from '@/utils/tokens/jwtTokens';

// Register all emergency-related socket handlers
export function registerEmergencyHandlers(
  io: Server,
  socket: Socket,
  role: TEntityRole
): void {
  // Handle provider accepting a request
  socket.on(
    SocketEvents.ACCEPT_REQUEST,
    async (data: { requestId: string; providerId: string }) => {
      await handleAcceptRequest(io, socket, data);
    }
  );

  // Handle provider rejecting a request
  socket.on(
    'reject-request',
    async (data: { requestId: string; providerId: string }) => {
      await handleRejectRequest(io, socket, data);
    }
  );

  // Handle provider connecting to request room
  socket.on(
    SocketEvents.PROVIDER_CONNECT,
    async (data: { requestId: string; providerId: string }) => {
      await handleProviderConnect(io, socket, data);
    }
  );

  // Handle user joining emergency room
  socket.on(
    SocketEvents.USER_JOIN_ROOM,
    async (data: { requestId: string; userId: string }) => {
      await handleUserJoinRoom(io, socket, data);
    }
  );

  // Handle location updates from provider or user
  socket.on(
    SocketEvents.LOCATION_UPDATE,
    async (data: {
      requestId: string;
      providerId?: string;
      userId?: string;
      location: { lat: number; lng: number };
      timestamp: number;
      isProvider?: boolean;
    }) => {
      await handleLocationUpdate(io, socket, data);
    }
  );

  // Handle arrival confirmation
  socket.on(
    SocketEvents.CONFIRM_ARRIVAL,
    async (
      data: { requestId: string; role: 'user' | 'provider' },
      callback?: (ack?: any) => void
    ) => {
      await handleConfirmArrival(io, socket, data, callback);
    }
  );

  // Handle cancel request
  socket.on(
    SocketEvents.CANCEL_REQUEST_SOCKET,
    async (
      data: { requestId: string; role: 'user' | 'provider' },
      callback?: (ack?: any) => void
    ) => {
      await handleCancelRequestSocket(io, socket, data, callback);
    }
  );
}

async function handleAcceptRequest(
  io: Server,
  socket: Socket,
  data: { requestId: string; providerId: string }
): Promise<void> {
  const { requestId, providerId } = data;

  try {
    logger.info(
      `[ACCEPT_ATTEMPT] Provider ${providerId} attempting to accept request ${requestId}`
    );

    const acquired = await acquireLock(requestId, providerId);

    if (!acquired) {
      logger.debug(
        `[LOST_RACE] Provider ${providerId} lost race for request ${requestId}`
      );

      socket.emit(SocketEvents.REQUEST_ALREADY_TAKEN, {
        requestId,
        message: 'Another provider accepted this request',
      });
      return;
    }

    // 3. Lock acquired! Update DB atomically
    const mustConnectBy = new Date(Date.now() + MUST_CONNECT_TIMEOUT_MS);

    const result = await db
      .update(emergencyRequest)
      .set({
        requestStatus: 'accepted',
        mustConnectBy: mustConnectBy.toISOString(),
      })
      .where(
        and(
          eq(emergencyRequest.id, requestId),
          eq(emergencyRequest.requestStatus, 'pending') // Critical: only if still pending
        )
      )
      .returning({
        id: emergencyRequest.id,
        userId: emergencyRequest.userId,
        serviceType: emergencyRequest.serviceType,
        description: emergencyRequest.description,
        location: emergencyRequest.location,
      });

    if (result.length === 0) {
      logger.debug(
        `Request ${requestId} already accepted by someone else (DB check)`
      );

      // Release lock
      await releaseLock(requestId);

      socket.emit(SocketEvents.REQUEST_ALREADY_TAKEN, {
        requestId,
        message: 'Request was just accepted by another provider',
      });
      return;
    }

    const request = result[0];

    if (!request) {
      logger.error(`[ERROR] Request ${requestId} not found after update`);
      await releaseLock(requestId);
      socket.emit(SocketEvents.ACCEPT_FAILED, {
        requestId,
        message: 'Request not found. Please try again.',
      });
      return;
    }

    logger.info(
      `[ACCEPT_SUCCESS] Provider ${providerId} successfully accepted request ${requestId}`
    );

    await db.insert(requestEvents).values({
      requestId,
      eventType: 'accepted',
      providerId,
      metadata: { acceptedAt: new Date().toISOString() },
    });

    // Create emergency response record
    const providerData = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, providerId),
    });

    await db.insert(emergencyResponse).values({
      emergencyRequestId: requestId,
      serviceProviderId: providerId,
      originLocation: {
        latitude: providerData?.currentLocation?.latitude || '0',
        longitude: providerData?.currentLocation?.longitude || '0',
      },
      destinationLocation: {
        latitude: request.location?.latitude.toString() || '0',
        longitude: request.location?.longitude.toString() || '0',
      },
      assignedAt: new Date(),
    });

    // Get list of providers who received this request
    const providerIds = await getEmergencyProviders(requestId);

    // Notify ALL providers (including this one)
    for (const pId of providerIds) {
      io.to(pId).emit(SocketEvents.REQUEST_TAKEN, {
        requestId,
        takenBy: providerId,
        message:
          pId === providerId
            ? 'You accepted this request!'
            : 'This request was accepted by another provider',
      });
    }

    // Get provider info
    const providerInfo = await db
      .select({
        id: serviceProvider.id,
        name: serviceProvider.name,
        phoneNumber: serviceProvider.phoneNumber,
        serviceType: serviceProvider.serviceType,
        vehicleInformation: serviceProvider.vehicleInformation,
        currentLocation: serviceProvider.currentLocation,
      })
      .from(serviceProvider)
      .where(eq(serviceProvider.id, providerId))
      .limit(1);

    const provider = providerInfo[0];

    // Calculate route from provider to user using Mapbox
    let routeData = null;
    if (provider?.currentLocation && request.location) {
      const providerLoc = provider.currentLocation;
      const userLoc = request.location;

      // Only calculate route if provider has valid location
      if (providerLoc.latitude && providerLoc.longitude) {
        const routeResult = await getRouteFromMapbox(
          {
            lat: parseFloat(providerLoc.latitude),
            lng: parseFloat(providerLoc.longitude),
          },
          {
            lat: userLoc.latitude,
            lng: userLoc.longitude,
          }
        );

        if (routeResult.success && routeResult.route) {
          routeData = routeResult.route;
          logger.debug(
            `Route calculated: ${routeData.distance}km, ${routeData.duration}min`
          );
        }
      }
    }

    // Notify the requestor
    io.to(`user:${request.userId}`).emit(SocketEvents.REQUEST_ACCEPTED, {
      requestId,
      provider: {
        id: provider?.id,
        name: provider?.name,
        phone: provider?.phoneNumber?.toString(),
        serviceType: provider?.serviceType,
        vehicleNumber: provider?.vehicleInformation?.number,
        location: provider?.currentLocation,
      },
      route: routeData,
      message: 'Help is on the way!',
    });

    // Confirm to this provider
    socket.emit(SocketEvents.ACCEPT_CONFIRMED, {
      requestId,
      request: {
        id: request.id,
        emergencyType: request.serviceType,
        location: request.location,
        description: request.description,
        requestorId: request.userId,
      },
      route: routeData,
      message: 'Request accepted! Please connect to start navigation.',
    });

    // Release Redis lock after 2 seconds (safety buffer)
    setTimeout(async () => {
      await releaseLock(requestId);
    }, 2000);
  } catch (error) {
    logger.error(`Error handling accept from provider ${providerId}:`, error);

    socket.emit(SocketEvents.ACCEPT_FAILED, {
      requestId,
      message: 'Failed to accept request. Please try again.',
    });
  }
}

/**
 * Handle provider rejecting an emergency request
 */
async function handleRejectRequest(
  io: Server,
  socket: Socket,
  data: { requestId: string; providerId: string }
): Promise<void> {
  const { requestId, providerId } = data;

  try {
    logger.error(
      `[ERROR] Provider ${providerId} rejected request ${requestId}`
    );

    await db.insert(requestEvents).values({
      requestId,
      eventType: 'rejected',
      providerId,
      metadata: { rejectedAt: new Date().toISOString() },
    });

    // Confirm rejection to provider
    socket.emit('reject-confirmed', {
      requestId,
      message: 'Request rejected.',
    });
  } catch (error) {
    logger.error(
      `[ERROR] Error handling reject from provider ${providerId}:`,
      error
    );
  }
}

/**
 * Handle provider connecting to emergency room after accepting
 */
async function handleProviderConnect(
  io: Server,
  socket: Socket,
  data: { requestId: string; providerId: string }
): Promise<void> {
  const { requestId, providerId } = data;

  try {
    logger.info(
      `[CONNECTED] Provider ${providerId} connecting to request ${requestId}`
    );

    const response = await db
      .select({
        id: emergencyResponse.id,
        requestId: emergencyResponse.emergencyRequestId,
        providerId: emergencyResponse.serviceProviderId,
      })
      .from(emergencyResponse)
      .where(
        and(
          eq(emergencyResponse.emergencyRequestId, requestId),
          eq(emergencyResponse.serviceProviderId, providerId)
        )
      )
      .limit(1);

    // Also get the request details
    const request = await db
      .select({
        id: emergencyRequest.id,
        userId: emergencyRequest.userId,
        serviceType: emergencyRequest.serviceType,
        location: emergencyRequest.location,
        requestStatus: emergencyRequest.requestStatus,
      })
      .from(emergencyRequest)
      .where(eq(emergencyRequest.id, requestId))
      .limit(1);

    if (response.length === 0 || request.length === 0) {
      logger.error(
        `[ERROR] Provider ${providerId} not assigned to request ${requestId}`
      );

      socket.emit(SocketEvents.CONNECTION_REJECTED, {
        requestId,
        reason: 'not-assigned',
        message: 'You are not assigned to this request',
      });
      return;
    }

    const req = request[0];
    if (!req) {
      socket.emit(SocketEvents.CONNECTION_REJECTED, {
        requestId,
        reason: 'not-found',
        message: 'Request not found',
      });
      return;
    }

    await db
      .update(emergencyRequest)
      .set({
        providerConnectedAt: new Date().toISOString(),
        requestStatus: 'in_progress',
      })
      .where(eq(emergencyRequest.id, requestId));

    const roomName = SocketRoom.EMERGENCY(requestId);
    socket.join(roomName);
    logger.debug(`[ROOM] Provider ${providerId} joined room ${roomName}`);

    await db.insert(requestEvents).values({
      requestId,
      eventType: 'provider-connected',
      providerId,
      metadata: { connectedAt: new Date().toISOString() },
    });

    await cacheProviderLocation(providerId, {
      lat: 0,
      lng: 0,
      timestamp: Date.now(),
      requestId,
    });

    // 6. Tell requestor to join the same room
    io.to(`user:${req.userId}`).emit(SocketEvents.JOIN_ROOM, {
      room: roomName,
      requestId,
      message: 'Provider connected. Join room for tracking.',
    });

    // 7. Confirm connection to provider
    socket.emit(SocketEvents.CONNECTION_CONFIRMED, {
      requestId,
      message: 'Connected successfully. You can now start navigation.',
      roomId: roomName,
    });

    logger.debug(
      `[SUCCESS] Provider ${providerId} successfully connected to request ${requestId}`
    );
  } catch (error) {
    logger.error(
      `[ERROR] Error connecting provider ${providerId} to request ${requestId}:`,
      error
    );

    socket.emit(SocketEvents.CONNECTION_FAILED, {
      requestId,
      message: 'Failed to establish connection. Please try again.',
    });
  }
}

/**
 * Handle user (requestor) joining emergency room
 */
async function handleUserJoinRoom(
  io: Server,
  socket: Socket,
  data: { requestId: string; userId: string }
): Promise<void> {
  const { requestId, userId } = data;

  try {
    // Verify user is requestor
    const request = await db
      .select({
        id: emergencyRequest.id,
        userId: emergencyRequest.userId,
        serviceType: emergencyRequest.serviceType,
        location: emergencyRequest.location,
        status: emergencyRequest.requestStatus,
      })
      .from(emergencyRequest)
      .where(eq(emergencyRequest.id, requestId))
      .limit(1);

    if (request.length === 0) {
      socket.emit(SocketEvents.JOIN_REJECTED, {
        requestId,
        reason: 'not-found',
        message: 'Emergency request not found',
      });
      return;
    }

    const req = request[0];

    // Join user to room
    const roomName = SocketRoom.EMERGENCY(requestId);
    socket.join(roomName);
    logger.info(`[USER] User ${userId} joined room ${roomName}`);

    // Get assigned provider from emergency response table
    const response = await db
      .select({
        providerId: emergencyResponse.serviceProviderId,
      })
      .from(emergencyResponse)
      .where(eq(emergencyResponse.emergencyRequestId, requestId))
      .limit(1);

    const providerId = response[0]?.providerId;

    if (providerId) {
      const provider = await db
        .select({
          id: serviceProvider.id,
          name: serviceProvider.name,
          phoneNumber: serviceProvider.phoneNumber,
          serviceType: serviceProvider.serviceType,
          vehicleInformation: serviceProvider.vehicleInformation,
        })
        .from(serviceProvider)
        .where(eq(serviceProvider.id, providerId))
        .limit(1);

      const providerData = provider[0];
      if (providerData) {
        // Emit to entire room that connection is established
        io.to(roomName).emit(SocketEvents.CONNECTION_ESTABLISHED, {
          requestId,
          provider: {
            id: providerData.id,
            name: providerData.name,
            phone: providerData.phoneNumber?.toString(),
            serviceType: providerData.serviceType,
            vehicleNumber: providerData.vehicleInformation?.number,
          },
          requestor: {
            id: userId,
          },
          message: 'Connection established. Tracking has begun.',
        });
      }
    }

    // Emit joined confirmation to user
    socket.emit(SocketEvents.JOINED_EMERGENCY_ROOM, {
      requestId,
      roomName,
      status: req?.status || 'pending',
    });
  } catch (error) {
    logger.error(`[ERROR] Error joining user ${userId} to room:`, error);

    socket.emit(SocketEvents.JOIN_REJECTED, {
      requestId,
      reason: 'error',
      message: 'Failed to join room. Please try again.',
    });
  }
}

/**
 * Handle location updates from provider or user
 */
async function handleLocationUpdate(
  io: Server,
  socket: Socket,
  data: {
    requestId: string;
    providerId?: string;
    userId?: string;
    location: { lat: number; lng: number };
    timestamp: number;
    isProvider?: boolean;
  }
): Promise<void> {
  const { requestId, providerId, userId, location, timestamp, isProvider } =
    data;

  try {
    // Determine who is sending the update
    const senderId = isProvider ? providerId : userId;
    const senderType = isProvider ? 'Provider' : 'User';

    const roomName = SocketRoom.EMERGENCY(requestId);
    const rooms = Array.from(socket.rooms);

    if (!rooms.includes(roomName)) {
      logger.warn(
        `[WARN] ${senderType} ${senderId} not in room for request ${requestId}`
      );
      return;
    }

    if (
      !location ||
      typeof location.lat !== 'number' ||
      typeof location.lng !== 'number' ||
      location.lat < -90 ||
      location.lat > 90 ||
      location.lng < -180 ||
      location.lng > 180
    ) {
      logger.warn(
        `[WARN] Invalid coordinates from ${senderType} ${senderId}:`,
        location
      );
      return;
    }

    if (isProvider && providerId) {
      cacheProviderLocation(providerId, {
        lat: location.lat,
        lng: location.lng,
        timestamp: timestamp || Date.now(),
        requestId,
      }).catch(error => {
        logger.error('Redis unavailable for location cache:', error);
      });
    }

    const eventName = isProvider
      ? SocketEvents.PROVIDER_LOCATION_UPDATED
      : SocketEvents.USER_LOCATION_UPDATED;

    io.to(roomName).emit(eventName, {
      location: {
        latitude: location.lat.toString(),
        longitude: location.lng.toString(),
      },
      timestamp: timestamp || Date.now(),
      providerId: isProvider ? providerId : undefined,
      userId: !isProvider ? userId : undefined,
    });

    logger.debug(
      `[LOCATION] ${senderType} location broadcasted for request ${requestId}`
    );
  } catch (error) {
    logger.error('[ERROR] Error handling location update:', error);
  }
}

/**
 * Handle arrival confirmation - mark request and response as completed
 */
async function handleConfirmArrival(
  io: Server,
  socket: Socket,
  data: { requestId: string; role: 'user' | 'provider' },
  callback?: (ack?: any) => void
): Promise<void> {
  const { requestId, role } = data;

  try {
    logger.debug(
      `[SUCCESS] ${role} confirming arrival for request ${requestId}`
    );

    const request = await db
      .select()
      .from(emergencyRequest)
      .where(eq(emergencyRequest.id, requestId))
      .limit(1);

    if (request.length === 0) {
      callback?.({ error: 'Emergency request not found' });
      socket.emit(SocketEvents.ACCEPT_FAILED, {
        requestId,
        message: 'Emergency request not found',
      });
      return;
    }

    const emergReq = request[0]!;

    const response = await db
      .select()
      .from(emergencyResponse)
      .where(eq(emergencyResponse.emergencyRequestId, requestId))
      .limit(1);

    if (response.length === 0) {
      callback?.({ error: 'No provider assigned to this request' });
      socket.emit(SocketEvents.ACCEPT_FAILED, {
        requestId,
        message: 'No provider assigned to this request',
      });
      return;
    }

    const emergResp = response[0]!;
    const completedAt = new Date().toISOString();

    await db.transaction(async tx => {
      // Update emergency request
      await tx
        .update(emergencyRequest)
        .set({
          requestStatus: 'completed',
          updatedAt: completedAt,
        })
        .where(eq(emergencyRequest.id, requestId));

      // Update emergency response
      await tx
        .update(emergencyResponse)
        .set({
          statusUpdate: 'accepted', // Keep status as accepted, use completion timestamp
          updatedAt: completedAt,
        })
        .where(eq(emergencyResponse.id, emergResp.id));

      // Mark provider as available
      if (emergResp.serviceProviderId) {
        await tx
          .update(serviceProvider)
          .set({
            serviceStatus: 'available',
          })
          .where(eq(serviceProvider.id, emergResp.serviceProviderId));
      }

      await tx.insert(requestEvents).values({
        requestId,
        eventType: 'completed',
        providerId: emergResp.serviceProviderId,
        metadata: {
          completedAt,
          completedBy: role,
        },
      });
    });

    logger.info(
      `[COMPLETED] Request ${requestId} marked as completed by ${role}`
    );

    // Send acknowledgment to client
    callback?.();

    io.to(SocketRoom.EMERGENCY(requestId)).emit(
      SocketEvents.REQUEST_COMPLETED,
      {
        requestId,
        completedBy: role,
        completedAt,
        message: 'Emergency has been marked as complete.',
      }
    );

    // Also emit to user and provider rooms
    if (emergReq.userId) {
      io.to(SocketRoom.USER(emergReq.userId)).emit(
        SocketEvents.REQUEST_COMPLETED,
        {
          requestId,
          completedBy: role,
          completedAt,
          message: 'Emergency has been marked as complete.',
        }
      );
    }

    if (emergResp.serviceProviderId) {
      io.to(SocketRoom.PROVIDER(emergResp.serviceProviderId)).emit(
        SocketEvents.REQUEST_COMPLETED,
        {
          requestId,
          completedBy: role,
          completedAt,
          message: 'Emergency has been marked as complete.',
        }
      );
    }
  } catch (error) {
    logger.error(
      `[ERROR] Error confirming arrival for request ${requestId}:`,
      error
    );

    callback?.({ error: 'Failed to confirm arrival' });

    socket.emit(SocketEvents.ACCEPT_FAILED, {
      requestId,
      message: 'Failed to confirm arrival. Please try again.',
    });
  }
}

/**
 * Handle cancel request from user or provider via socket
 */
async function handleCancelRequestSocket(
  io: Server,
  socket: Socket,
  data: { requestId: string; role: 'user' | 'provider' },
  callback?: (ack?: any) => void
): Promise<void> {
  const { requestId, role } = data;

  try {
    logger.debug(`[ERROR] ${role} cancelling request ${requestId}`);

    const request = await db
      .select()
      .from(emergencyRequest)
      .where(eq(emergencyRequest.id, requestId))
      .limit(1);

    if (request.length === 0) {
      callback?.({ error: 'Emergency request not found' });
      socket.emit(SocketEvents.ACCEPT_FAILED, {
        requestId,
        message: 'Emergency request not found',
      });
      return;
    }

    const emergReq = request[0]!;

    // Check if already cancelled
    if (emergReq.requestStatus === 'cancelled') {
      callback?.({ error: 'Request is already cancelled' });
      socket.emit(SocketEvents.ACCEPT_FAILED, {
        requestId,
        message: 'Request is already cancelled',
      });
      return;
    }

    const cancelledAt = new Date().toISOString();

    await db.transaction(async tx => {
      // Update emergency request
      await tx
        .update(emergencyRequest)
        .set({
          requestStatus: 'cancelled',
          updatedAt: cancelledAt,
        })
        .where(eq(emergencyRequest.id, requestId));

      await tx.insert(requestEvents).values({
        requestId,
        eventType: 'request_cancelled',
        providerId: undefined,
        metadata: {
          cancelledAt,
          cancelledBy: role,
        },
      });
    });

    logger.info(`[SUCCESS] Request ${requestId} cancelled by ${role}`);

    // Send acknowledgment to client
    callback?.();

    const otherPartyRole = role === 'user' ? 'provider' : 'user';
    const messageText =
      role === 'user'
        ? 'The user has cancelled this emergency request.'
        : 'The service provider has cancelled this emergency request.';

    io.to(SocketRoom.EMERGENCY(requestId)).emit(
      SocketEvents.REQUEST_CANCELLED_NOTIFICATION,
      {
        requestId,
        cancelledBy: role,
        cancelledAt,
        message: messageText,
      }
    );

    // Also emit to specific user and provider rooms
    if (emergReq.userId) {
      io.to(SocketRoom.USER(emergReq.userId)).emit(
        SocketEvents.REQUEST_CANCELLED_NOTIFICATION,
        {
          requestId,
          cancelledBy: role,
          cancelledAt,
          message: messageText,
        }
      );
    }

    // Get provider ID from emergency response
    const response = await db
      .select()
      .from(emergencyResponse)
      .where(eq(emergencyResponse.emergencyRequestId, requestId))
      .limit(1);

    if (response.length > 0 && response[0]?.serviceProviderId) {
      io.to(SocketRoom.PROVIDER(response[0].serviceProviderId)).emit(
        SocketEvents.REQUEST_CANCELLED_NOTIFICATION,
        {
          requestId,
          cancelledBy: role,
          cancelledAt,
          message: messageText,
        }
      );
    }
  } catch (error) {
    logger.error(`[ERROR] Error cancelling request ${requestId}:`, error);

    callback?.({ error: 'Failed to cancel request' });

    socket.emit(SocketEvents.ACCEPT_FAILED, {
      requestId,
      message: 'Failed to cancel request. Please try again.',
    });
  }
}
