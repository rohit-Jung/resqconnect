import {
  emergencyRequest,
  requestEvents,
  serviceProvider,
  user,
} from '@repo/db/schemas';
import { EmergencyRequestPayload } from '@repo/types/validations';

import { eq } from 'drizzle-orm';
import type { Server } from 'socket.io';

import { logger } from '@/config';
import {
  EXPANDED_K_RING_RADIUS,
  INITIAL_K_RING_RADIUS,
  MAX_PROVIDERS_TO_BROADCAST,
} from '@/constants';
import { KAFKA_TOPICS } from '@/constants/kafka.constants';
import { SocketEvents, SocketRoom } from '@/constants/socket.constants';
import db from '@/db';
import { assignResponderConsumer } from '@/services/kafka/kafka.service';
import {
  calculateDistancesAndSort,
  findNearbyProviders,
} from '@/services/matching.service';
import { cacheEmergencyProviders } from '@/services/redis.service';
import { getIo } from '@/socket';

async function startEmergencyRequestService() {
  logger.info('Starting Kafka consumer connection...');
  const startTime = Date.now();

  await assignResponderConsumer.connect();
  logger.info(`Kafka connected in ${Date.now() - startTime}ms`);

  await assignResponderConsumer.subscribe({
    // TODO: since we are deploy each sector differently this is a baaad strategy for topic distri
    topics: [
      KAFKA_TOPICS.MEDICAL_EVENTS,
      KAFKA_TOPICS.FIRE_EVENTS,
      KAFKA_TOPICS.POLICE_EVENTS,
      KAFKA_TOPICS.RESCUE_EVENTS,
    ],
    fromBeginning: false, // Don't process old messages on restart
  });

  await assignResponderConsumer.run({
    // Process multiple partitions concurrently
    partitionsConsumedConcurrently: 3,
    eachMessage: async ({ topic, message, partition }) => {
      const messageStartTime = Date.now();

      const data = JSON.parse(message.value!.toString());
      const parsedData = EmergencyRequestPayload.safeParse(data);

      console.log('[CONSUMER] assignResponderConsumer', parsedData.data);

      if (!parsedData.success) {
        logger.error('Invalid message format:', {
          topic,
          partition,
          offset: message.offset,
          errors: parsedData.error.issues,
          rawData: data,
        });
        return;
      }

      const { requestId, emergencyLocation, emergencyType, userId } =
        parsedData.data;

      // parallel fetch: check request exists AND get user info at the same time
      const [existingRequest, userInfo] = await Promise.all([
        db.query.emergencyRequest.findFirst({
          where: eq(emergencyRequest.id, requestId),
        }),
        db.query.user.findFirst({
          where: eq(user.id, userId),
        }),
      ]);

      if (!existingRequest || existingRequest.requestStatus !== 'pending') {
        logger.info(
          `Request ${requestId} not pending, skipping. Status: ${existingRequest?.requestStatus}`
        );
        return;
      }

      // Update status (don't await if not critical for next step)
      const updateStatusPromise = db
        .update(emergencyRequest)
        .set({ requestStatus: 'in_progress' })
        .where(eq(emergencyRequest.id, requestId));

      const { latitude, longitude } = emergencyLocation;

      // Find providers (this is the slow part - H3 index lookup)
      const providerSearchStart = Date.now();

      let providers = await findNearbyProviders({
        lat: latitude,
        lng: longitude,
        type: emergencyType,
        kRingRadius: INITIAL_K_RING_RADIUS,
      });

      if (providers.length < 3) {
        logger.info(
          `Only ${providers.length} providers in radius ${INITIAL_K_RING_RADIUS}, expanding...`
        );
        providers = await findNearbyProviders({
          lat: latitude,
          lng: longitude,
          type: emergencyType,
          kRingRadius: EXPANDED_K_RING_RADIUS,
        });
      }

      logger.info(
        `Provider search took ${Date.now() - providerSearchStart}ms, found ${providers.length}`
      );

      // Wait for status update now
      await updateStatusPromise;

      if (providers.length === 0) {
        logger.warn(`No providers available for request ${requestId}`);
        await db.insert(requestEvents).values({
          requestId,
          eventType: 'no-providers-initial',
          metadata: { searchRadius: EXPANDED_K_RING_RADIUS },
        });
        return;
      }

      // Calculate distances (external API - can be slow)
      const distanceCalcStart = Date.now();
      const providersWithDistance = await calculateDistancesAndSort(
        providers,
        emergencyLocation
      );
      logger.info(
        `Distance calculation took ${Date.now() - distanceCalcStart}ms`
      );

      const top10Providers = providersWithDistance.slice(
        0,
        MAX_PROVIDERS_TO_BROADCAST
      );

      // Cache and log in parallel
      await Promise.all([
        cacheEmergencyProviders(
          requestId,
          top10Providers.map(p => p.id)
        ),
        db.insert(requestEvents).values({
          requestId,
          eventType: 'providers-found',
          metadata: {
            totalFound: providers.length,
            broadcasted: top10Providers.length,
          },
        }),
      ]);

      const io = getIo();
      if (!io) {
        logger.error('Socket not initialized');
        return;
      }

      // Broadcast to ALL providers simultaneously
      const providerIds = top10Providers.map(p => p.id);
      const payload = {
        ...parsedData.data,
        username: userInfo?.name?.toString() ?? 'Unknown',
        userPhone: userInfo?.phoneNumber?.toString() ?? '',
        userEmail: userInfo?.email?.toString() ?? '',
      };

      console.log('top 10 providers-found', top10Providers);
      for (const provider of top10Providers) {
        const roomName = SocketRoom.PROVIDER(provider.id);
        io.to(roomName).emit(SocketEvents.NEW_EMERGENCY, payload);
        logger.debug(`Emitted to ${roomName}`);
      }

      logger.info(
        `Broadcasted to ${top10Providers.length} providers in ${Date.now() - messageStartTime}ms`
      );

      // Wait for provider decision
      const result = await waitForAnyProviderDecision({
        io,
        requestId,
        providerIds,
        timeoutMs: 120_000,
      });

      if (result.decision === 'ACCEPTED' && result.providerId) {
        await Promise.all([
          db
            .update(serviceProvider)
            .set({ serviceStatus: 'assigned' })
            .where(eq(serviceProvider.id, result.providerId)),
          db
            .update(emergencyRequest)
            .set({ requestStatus: 'assigned' })
            .where(eq(emergencyRequest.id, requestId)),
        ]);

        io.in(result.providerId).socketsJoin(SocketRoom.EMERGENCY(requestId));
        io.in(userId).socketsJoin(SocketRoom.EMERGENCY(requestId));

        // Get provider info to include in notification
        const providerData = await db.query.serviceProvider.findFirst({
          where: eq(serviceProvider.id, result.providerId),
        });

        // inform others that it's accepted
        io.to(SocketRoom.EMERGENCY(requestId)).emit(
          SocketEvents.REQUEST_ACCEPTED,
          {
            requestId,
            emergencyLocation,
            emergencyType,
            providerId: result.providerId,
            provider: {
              id: providerData?.id,
              name: providerData?.name,
              phone: providerData?.phoneNumber?.toString(),
              serviceType: providerData?.serviceType,
              vehicleNumber: providerData?.vehicleInformation?.number,
              location: providerData?.currentLocation,
            },
          }
        );

        logger.info(
          `Request ${requestId} assigned to provider ${result.providerId}`
        );
      } else if (result.decision === 'TIMEOUT') {
        await db
          .update(emergencyRequest)
          .set({ requestStatus: 'no_providers_available' })
          .where(eq(emergencyRequest.id, requestId));

        io.to(SocketRoom.USER(userId)).emit(SocketEvents.EMERGENCY_FAILED, {
          requestId,
          message: 'No providers available at this time. Please try again.',
        });

        logger.warn(`Request ${requestId} timed out - no providers accepted`);
      }

      logger.info(
        `Total message processing time: ${Date.now() - messageStartTime}ms`
      );
    },
  });
}

/**
 * Wait for ANY provider from the list to accept (first one wins).
 * The actual race condition is handled by Redis distributed lock in the socket handler.
 * This function just waits for a successful acceptance or timeout.
 */
async function waitForAnyProviderDecision({
  io,
  requestId,
  providerIds,
  timeoutMs = 120_000,
}: {
  io: Server;
  requestId: string;
  providerIds: string[];
  timeoutMs?: number;
}): Promise<{ decision: 'ACCEPTED' | 'TIMEOUT'; providerId?: string }> {
  return new Promise(res => {
    const rejections = new Set<string>();

    const timer = setTimeout(() => {
      cleanup();
      res({ decision: 'TIMEOUT' });
    }, timeoutMs);

    const handler = (payload: {
      requestId: string;
      providerId: string;
      decision: 'ACCEPTED' | 'REJECTED';
    }) => {
      // Only handle events for this request and from providers in our list
      if (
        payload.requestId !== requestId ||
        !providerIds.includes(payload.providerId)
      ) {
        return;
      }

      if (payload.decision === 'ACCEPTED') {
        cleanup();
        res({ decision: 'ACCEPTED', providerId: payload.providerId });
        return;
      }

      if (payload.decision === 'REJECTED') {
        rejections.add(payload.providerId);
        // If all providers rejected, resolve as timeout
        if (rejections.size >= providerIds.length) {
          cleanup();
          res({ decision: 'TIMEOUT' });
        }
      }
    };

    function cleanup() {
      clearTimeout(timer);
      io.off(SocketEvents.PROVIDER_DECISION, handler);
    }

    io.on(SocketEvents.PROVIDER_DECISION, handler);
  });
}

export { startEmergencyRequestService };
