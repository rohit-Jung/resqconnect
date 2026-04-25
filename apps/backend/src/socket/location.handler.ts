import { emergencyRequest, serviceProvider } from '@repo/db/schemas';

import { eq, sql } from 'drizzle-orm';
import { latLngToCell } from 'h3-js';
import { Server, Socket } from 'socket.io';

import { envConfig, logger } from '@/config';
import { SocketEvents, SocketRoom } from '@/constants/socket.constants';
import db from '@/db';

const LOCATION_RADIUS_METERS = 50;

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function setupLocationHandlers(io: Server, socket: Socket) {
  socket.on(SocketEvents.LOCATION_UPDATE, async data => {
    // Handle both nested and flat location formats
    let latitude: number | undefined;
    let longitude: number | undefined;

    if (data.location && typeof data.location === 'object') {
      // Nested format: location: { lat, lng } or location: { latitude, longitude }
      latitude = data.location.lat || data.location.latitude;
      longitude = data.location.lng || data.location.longitude;
    } else {
      // Flat format: top-level latitude, longitude
      latitude = data.latitude;
      longitude = data.longitude;
    }

    const { requestId, providerId, userId, timestamp } = data;

    logger.debug(`Location update for request ${requestId}`);

    if (!requestId || (!providerId && !userId)) {
      logger.error('Invalid location update data');
      return;
    }

    if (!latitude || !longitude) {
      logger.error(
        `Invalid location coordinates - lat: ${latitude}, lng: ${longitude}`
      );
      return;
    }

    if (providerId) {
      // Provider location → broadcast to emergency room
      io.to(SocketRoom.EMERGENCY(requestId)).emit(
        SocketEvents.PROVIDER_LOCATION_UPDATED,
        {
          providerId,
          location: { latitude, longitude },
          timestamp: timestamp || Date.now(),
        }
      );

      // Forward to platform for user tracking
      if (envConfig.platform_base_url) {
        const { postJsonWithRetry } =
          await import('@/services/internal-http.service');

        // Fetch userId from request in DB
        const request = await db.query.emergencyRequest.findFirst({
          where: eq(emergencyRequest.id, requestId),
          columns: { userId: true },
        });

        postJsonWithRetry(
          `${envConfig.platform_base_url}/api/v1/internal/incidents/${requestId}/update`,
          {
            headers: {
              'x-internal-api-key': envConfig.internal_api_key as string,
            },
            body: {
              userId: request?.userId,
              eventType: SocketEvents.PROVIDER_LOCATION_UPDATED,
              payload: {
                providerId,
                location: { latitude, longitude },
                timestamp: timestamp || Date.now(),
              },
            },
            timeoutMs: 1000,
            retries: 1,
          }
        ).catch(e => logger.warn(`[LOCATION] Failed to notify platform: ${e}`));
      }
    } else if (userId) {
      // User location → broadcast to emergency room
      io.to(SocketRoom.EMERGENCY(requestId)).emit(
        SocketEvents.USER_LOCATION_UPDATED,
        {
          userId,
          location: { latitude, longitude },
          timestamp: timestamp || Date.now(),
        }
      );
    }
  });

  socket.on(SocketEvents.EMERGENCY_COMPLETED, async data => {
    const { requestId, providerId } = data;

    logger.debug(`[SUCCESS] Emergency ${requestId} completed by ${providerId}`);

    io.to(SocketRoom.EMERGENCY(requestId)).emit(
      SocketEvents.EMERGENCY_COMPLETED,
      {
        requestId,
        providerId,
        completedAt: Date.now(),
      }
    );
  });

  socket.on(
    SocketEvents.PROVIDER_PERIODIC_LOCATION,
    async ({ latitude, longitude, serviceStatus }) => {
      const providerId = socket.user.id;
      logger.debug(
        `[LOCATION] Periodic location update from provider ${providerId}: lat=${latitude}, lng=${longitude}, status=${serviceStatus}`
      );

      if (!latitude || !longitude) {
        logger.error('Invalid location data in periodic update');
        return;
      }

      if (serviceStatus !== 'available') {
        logger.debug(
          `Provider ${providerId} is not available, skipping location broadcast`
        );
        return;
      }

      try {
        const existingProvider = await db.query.serviceProvider.findFirst({
          where: eq(serviceProvider.id, providerId),
          columns: {
            currentLocation: true,
            lastLocation: true,
          },
        });

        if (!existingProvider) {
          logger.error('Provider not found:', providerId);
          return;
        }

        const lastLat = existingProvider.currentLocation?.latitude
          ? parseFloat(existingProvider.currentLocation.latitude)
          : null;
        const lastLng = existingProvider.currentLocation?.longitude
          ? parseFloat(existingProvider.currentLocation.longitude)
          : null;

        const hasSignificantChange =
          !lastLat ||
          !lastLng ||
          calculateDistance(lastLat, lastLng, latitude, longitude) >
            LOCATION_RADIUS_METERS;

        if (!hasSignificantChange) {
          logger.debug(
            `Provider ${providerId} location within ${LOCATION_RADIUS_METERS}m radius, updating silently`
          );
        }

        const locationPoint = `POINT(${longitude} ${latitude})`;
        const h3Index = latLngToCell(latitude, longitude, 8);
        const h3IndexBigInt = BigInt(`0x${h3Index}`);

        await db
          .update(serviceProvider)
          .set({
            currentLocation: {
              latitude: latitude.toString(),
              longitude: longitude.toString(),
            },
            lastLocation: sql`ST_SetSRID(ST_GeomFromText(${locationPoint}), 4326)`,
            h3Index: h3IndexBigInt,
          })
          .where(eq(serviceProvider.id, providerId));

        io.to(SocketRoom.PROVIDER(providerId)).emit(
          SocketEvents.PROVIDER_LOCATION_UPDATED,
          {
            providerId,
            location: { latitude, longitude },
            timestamp: Date.now(),
          }
        );

        logger.debug(
          `[SUCCESS] Provider ${providerId} location updated and broadcasted`
        );
      } catch (error) {
        logger.error('Error processing periodic location update:', error);
      }
    }
  );
}
