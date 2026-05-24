import { emergencyRequest, requestEvents, user } from '@repo/db/schemas';
import { EmergencyRequestPayload } from '@repo/types/validations';

import { and, eq } from 'drizzle-orm';

import { logger } from '@/config';
import {
  EXPANDED_K_RING_RADIUS,
  INITIAL_K_RING_RADIUS,
  MAX_PROVIDERS_TO_BROADCAST,
  REQUEST_TIMEOUT_MS,
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

export async function startEmergencyRequestService() {
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
    // process multiple partitions concurrently
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

      const {
        requestId,
        emergencyLocation,
        emergencyType,
        userId,
        emergencyDescription,
        expiresAt,
      } = parsedData.data;

      // seed silo db if record not yet present (platform creates in platform db;
      // silo db only gets the record via this kafka path).
      await db
        .insert(emergencyRequest)
        .values({
          id: requestId,
          userId: userId,
          serviceType: emergencyType,
          description: emergencyDescription ?? null,
          location: emergencyLocation,
          requestStatus: 'pending',
          searchRadius: 1,
          expiresAt: expiresAt ?? null,
          h3Index: null,
          geoLocation: null,
        })
        .onConflictDoNothing();

      // claim request atomically so duplicate kafka deliveries cannot process
      // the same pending request concurrently.
      const [claimedRows, userInfo] = await Promise.all([
        db
          .update(emergencyRequest)
          .set({ requestStatus: 'in_progress' })
          .where(
            and(
              eq(emergencyRequest.id, requestId),
              eq(emergencyRequest.requestStatus, 'pending')
            )
          )
          .returning({ id: emergencyRequest.id }),
        db.query.user.findFirst({
          where: eq(user.id, userId),
        }),
      ]);

      if (claimedRows.length === 0) {
        logger.info(
          `Request ${requestId} already claimed or not pending, skipping`
        );
        return;
      }

      const { latitude, longitude } = emergencyLocation;

      // find providers (this is the slow part - h3 index lookup)
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

      if (providers.length === 0) {
        logger.warn(`No providers available for request ${requestId}`);
        await db.insert(requestEvents).values({
          requestId,
          eventType: 'no-providers-initial',
          metadata: { searchRadius: EXPANDED_K_RING_RADIUS },
        });
        return;
      }

      // calculate distances (external api - can be slow)
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

      // cache and log in parallel
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

      // broadcast to all providers simultaneously
      // const providerids = top10providers.map(p => p.id);
      const payload = {
        ...parsedData.data,
        username: userInfo?.name?.toString() ?? 'Unknown',
        userPhone: userInfo?.phoneNumber?.toString() ?? '',
        userEmail: userInfo?.email?.toString() ?? '',
      };

      for (const provider of top10Providers) {
        const roomName = SocketRoom.PROVIDER(provider.id);
        io.to(roomName).emit(SocketEvents.NEW_EMERGENCY, payload);
        logger.debug(`Emitted to ${roomName}`);
      }

      logger.info(
        `Broadcasted to ${top10Providers.length} providers in ${Date.now() - messageStartTime}ms`
      );

      // set request expiry and revert to pending
      await db
        .update(emergencyRequest)
        .set({
          requestStatus: 'pending',
          expiresAt: new Date(Date.now() + REQUEST_TIMEOUT_MS).toISOString(),
          searchRadius: INITIAL_K_RING_RADIUS,
        })
        .where(eq(emergencyRequest.id, requestId));

      logger.info(
        `Broadcasted request ${requestId} to ${top10Providers.length} providers`
      );

      logger.info(
        `Total message processing time: ${Date.now() - messageStartTime}ms`
      );

      logger.info(
        `Total message processing time: ${Date.now() - messageStartTime}ms`
      );
    },
  });
}
