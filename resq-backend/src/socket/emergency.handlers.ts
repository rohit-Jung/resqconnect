import { and, eq } from 'drizzle-orm';
import type { Server, Socket } from 'socket.io';

import db from '@/db';
import { emergencyRequest, requestEvents, serviceProvider } from '@/models';
import { getRoute } from '@/services/mapbox.service';
import {
  acquireLock,
  cacheProviderLocation,
  getEmergencyProviders,
  releaseLock,
} from '@/services/redis.service';

// Constants
const MUST_CONNECT_TIMEOUT_MS = 15000; // 15 seconds

/**
 * Register all emergency-related socket handlers
 */
export function registerEmergencyHandlers(io: Server, socket: Socket): void {
  // Handle provider accepting a request
  socket.on(
    socketEvents.ACCEPT_REQUEST,
    async (data: { requestId: string; providerId: string }) => {
      await handleAcceptRequest(io, socket, data);
    }
  );

  // Handle provider rejecting a request
  socket.on('reject-request', async (data: { requestId: string; providerId: string }) => {
    await handleRejectRequest(io, socket, data);
  });

  // Handle provider connecting to request room
  socket.on(
    socketEvents.PROVIDER_CONNECT,
    async (data: { requestId: string; providerId: string }) => {
      await handleProviderConnect(io, socket, data);
    }
  );

  // Handle user joining emergency room
  socket.on(socketEvents.USER_JOIN_ROOM, async (data: { requestId: string; userId: string }) => {
    await handleUserJoinRoom(io, socket, data);
  });

  // Handle location updates from provider
  socket.on(
    socketEvents.LOCATION_UPDATE,
    async (data: {
      requestId: string;
      providerId: string;
      location: { lat: number; lng: number };
      timestamp: number;
    }) => {
      await handleLocationUpdate(io, socket, data);
    }
  );
}

/**
 * Handle provider accepting an emergency request
 * Uses Redis distributed lock to prevent race conditions
 */
async function handleAcceptRequest(
  io: Server,
  socket: Socket,
  data: { requestId: string; providerId: string }
): Promise<void> {
  const { requestId, providerId } = data;

  try {
    console.log(`🤝 Provider ${providerId} attempting to accept request ${requestId}`);

    // 1. Try to acquire Redis distributed lock
    const acquired = await acquireLock(requestId, providerId);

    // 2. If lock NOT acquired, someone else got it first
    if (!acquired) {
      console.log(`❌ Provider ${providerId} lost race for request ${requestId}`);

      socket.emit(socketEvents.REQUEST_ALREADY_TAKEN, {
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
        providerId: providerId,
        acceptedAt: new Date().toISOString(),
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

    // 4. If UPDATE returned 0 rows, request was already taken
    if (result.length === 0) {
      console.log(`❌ Request ${requestId} already accepted by someone else (DB check)`);

      // Release lock
      await releaseLock(requestId);

      socket.emit(socketEvents.REQUEST_ALREADY_TAKEN, {
        requestId,
        message: 'Request was just accepted by another provider',
      });
      return;
    }

    // 5. SUCCESS! This provider got it
    const request = result[0];

    if (!request) {
      console.log(`❌ Request ${requestId} not found after update`);
      await releaseLock(requestId);
      socket.emit(socketEvents.ACCEPT_FAILED, {
        requestId,
        message: 'Request not found. Please try again.',
      });
      return;
    }

    console.log(`✅ Provider ${providerId} successfully accepted request ${requestId}`);

    // Log event
    await db.insert(requestEvents).values({
      requestId,
      eventType: 'accepted',
      providerId,
      metadata: { acceptedAt: new Date().toISOString() },
    });

    // Get list of providers who received this request
    const providerIds = await getEmergencyProviders(requestId);

    // Notify ALL providers (including this one)
    for (const pId of providerIds) {
      io.to(pId).emit(socketEvents.REQUEST_TAKEN, {
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
        const routeResult = await getRoute(
          {
            latitude: parseFloat(providerLoc.latitude),
            longitude: parseFloat(providerLoc.longitude),
          },
          {
            latitude: userLoc.latitude,
            longitude: userLoc.longitude,
          }
        );

        if (routeResult.success && routeResult.route) {
          routeData = routeResult.route;
          console.log(`🗺️ Route calculated: ${routeData.distance}km, ${routeData.duration}min`);
        }
      }
    }

    // Notify the requestor
    io.to(`user:${request.userId}`).emit(socketEvents.REQUEST_ACCEPTED, {
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
    socket.emit(socketEvents.ACCEPT_CONFIRMED, {
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
    console.error(`❌ Error handling accept from provider ${providerId}:`, error);

    socket.emit(socketEvents.ACCEPT_FAILED, {
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
    console.log(`❌ Provider ${providerId} rejected request ${requestId}`);

    // Log event
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
    console.error(`❌ Error handling reject from provider ${providerId}:`, error);
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
    console.log(`🔌 Provider ${providerId} connecting to request ${requestId}`);

    // 1. Verify this provider is assigned to this request
    const request = await db
      .select({
        id: emergencyRequest.id,
        userId: emergencyRequest.userId,
        serviceType: emergencyRequest.serviceType,
        location: emergencyRequest.location,
        providerId: emergencyRequest.providerId,
        requestStatus: emergencyRequest.requestStatus,
      })
      .from(emergencyRequest)
      .where(
        and(
          eq(emergencyRequest.id, requestId),
          eq(emergencyRequest.providerId, providerId),
          eq(emergencyRequest.requestStatus, 'accepted')
        )
      )
      .limit(1);

    // 2. If not found, reject connection
    if (request.length === 0) {
      console.log(`❌ Provider ${providerId} not assigned to request ${requestId}`);

      socket.emit(socketEvents.CONNECTION_REJECTED, {
        requestId,
        reason: 'not-assigned',
        message: 'You are not assigned to this request',
      });
      return;
    }

    const req = request[0];
    if (!req) {
      socket.emit(socketEvents.CONNECTION_REJECTED, {
        requestId,
        reason: 'not-found',
        message: 'Request not found',
      });
      return;
    }

    // 3. Update DB - mark as connected
    await db
      .update(emergencyRequest)
      .set({
        providerConnectedAt: new Date().toISOString(),
        requestStatus: 'in_progress',
      })
      .where(eq(emergencyRequest.id, requestId));

    // 4. Join provider to room
    const roomName = socketEvents.EMERGENCY_ROOM(requestId);
    socket.join(roomName);
    console.log(`🏠 Provider ${providerId} joined room ${roomName}`);

    // Log event
    await db.insert(requestEvents).values({
      requestId,
      eventType: 'provider-connected',
      providerId,
      metadata: { connectedAt: new Date().toISOString() },
    });

    // 5. Initialize Redis location cache for this provider
    await cacheProviderLocation(providerId, {
      lat: 0,
      lng: 0,
      timestamp: Date.now(),
      requestId,
    });

    // 6. Tell requestor to join the same room
    io.to(`user:${req.userId}`).emit(socketEvents.JOIN_ROOM, {
      room: roomName,
      requestId,
      message: 'Provider connected. Join room for tracking.',
    });

    // 7. Confirm connection to provider
    socket.emit(socketEvents.CONNECTION_CONFIRMED, {
      requestId,
      message: 'Connected successfully. You can now start navigation.',
      roomId: roomName,
    });

    console.log(`✅ Provider ${providerId} successfully connected to request ${requestId}`);
  } catch (error) {
    console.error(`❌ Error connecting provider ${providerId} to request ${requestId}:`, error);

    socket.emit(socketEvents.CONNECTION_FAILED, {
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
        providerId: emergencyRequest.providerId,
        serviceType: emergencyRequest.serviceType,
        location: emergencyRequest.location,
      })
      .from(emergencyRequest)
      .where(and(eq(emergencyRequest.id, requestId), eq(emergencyRequest.userId, userId)))
      .limit(1);

    if (request.length === 0) {
      socket.emit(socketEvents.JOIN_REJECTED, {
        requestId,
        reason: 'not-requestor',
        message: 'You are not the requestor of this emergency',
      });
      return;
    }

    const req = request[0];
    if (!req) {
      socket.emit(socketEvents.JOIN_REJECTED, {
        requestId,
        reason: 'not-found',
        message: 'Request not found',
      });
      return;
    }

    // Join user to room
    const roomName = socketEvents.EMERGENCY_ROOM(requestId);
    socket.join(roomName);
    console.log(`👤 User ${userId} joined room ${roomName}`);

    // Get provider details
    if (req.providerId) {
      const provider = await db
        .select({
          id: serviceProvider.id,
          name: serviceProvider.name,
          phoneNumber: serviceProvider.phoneNumber,
          serviceType: serviceProvider.serviceType,
          vehicleInformation: serviceProvider.vehicleInformation,
        })
        .from(serviceProvider)
        .where(eq(serviceProvider.id, req.providerId))
        .limit(1);

      // Emit to entire room that connection is established
      io.to(roomName).emit(socketEvents.CONNECTION_ESTABLISHED, {
        requestId,
        provider: {
          id: provider[0]?.id,
          name: provider[0]?.name,
          phone: provider[0]?.phoneNumber?.toString(),
          serviceType: provider[0]?.serviceType,
          vehicleNumber: provider[0]?.vehicleInformation?.number,
        },
        requestor: {
          id: userId,
        },
        message: 'Connection established. Tracking has begun.',
      });
    }
  } catch (error) {
    console.error(`❌ Error joining user ${userId} to room:`, error);

    socket.emit(socketEvents.JOIN_REJECTED, {
      requestId,
      reason: 'error',
      message: 'Failed to join room. Please try again.',
    });
  }
}

/**
 * Handle location updates from provider
 */
async function handleLocationUpdate(
  io: Server,
  socket: Socket,
  data: {
    requestId: string;
    providerId: string;
    location: { lat: number; lng: number };
    timestamp: number;
  }
): Promise<void> {
  const { requestId, providerId, location, timestamp } = data;

  try {
    // 1. Validate provider is in room
    const roomName = socketEvents.EMERGENCY_ROOM(requestId);
    const rooms = Array.from(socket.rooms);

    if (!rooms.includes(roomName)) {
      console.warn(`⚠️ Provider ${providerId} not in room for request ${requestId}`);
      return;
    }

    // 2. Validate coordinates
    if (
      !location.lat ||
      !location.lng ||
      location.lat < -90 ||
      location.lat > 90 ||
      location.lng < -180 ||
      location.lng > 180
    ) {
      console.warn(`⚠️ Invalid coordinates from provider ${providerId}`);
      return;
    }

    // 3. Update Redis cache (non-blocking, best-effort)
    cacheProviderLocation(providerId, {
      lat: location.lat,
      lng: location.lng,
      timestamp: timestamp || Date.now(),
      requestId,
    }).catch(error => {
      console.error('Redis unavailable for location cache:', error);
    });

    // 4. Broadcast to room (including requestor)
    io.to(roomName).emit(socketEvents.PROVIDER_LOCATION, {
      location: {
        lat: location.lat,
        lng: location.lng,
      },
      timestamp: timestamp || Date.now(),
      providerId,
    });
  } catch (error) {
    console.error('❌ Error handling location update:', error);
  }
}
