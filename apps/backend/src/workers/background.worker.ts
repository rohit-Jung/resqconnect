import {
  emergencyRequest,
  outbox,
  requestEvents,
  serviceProvider,
} from '@repo/db/schemas';

import { and, asc, eq, isNull, lt, sql } from 'drizzle-orm';
import { gridDisk, latLngToCell } from 'h3-js';

import { logger } from '@/config/logger/winston.config';
import {
  DISCONNECT_CHECK_INTERVAL,
  MAX_SEARCH_RADIUS,
  OUTBOX_POLL_INTERVAL,
  REQUEST_TIMEOUT_MS,
  TIMEOUT_CHECK_INTERVAL,
} from '@/constants';
import { KAFKA_TOPICS } from '@/constants/kafka.constants';
import { SocketEvents, SocketRoom } from '@/constants/socket.constants';
import db from '@/db';
import { safeSend } from '@/services/kafka/kafka.service';
import { getEmergencyProviders } from '@/services/redis.service';
import { getIo } from '@/socket';

// runs every 1 second to process pending outbox events
export function startOutboxPublisher(): NodeJS.Timeout {
  logger.debug('Starting Outbox Publisher Worker...');

  return setInterval(async () => {
    try {
      // query pending outbox events
      const pendingEvents = await db
        .select()
        .from(outbox)
        .where(eq(outbox.status, 'pending'))
        .orderBy(asc(outbox.createdAt))
        .limit(100);

      if (pendingEvents.length === 0) return;

      logger.debug(`Processing ${pendingEvents.length} outbox events...`);

      for (const event of pendingEvents) {
        try {
          const topic = event.kafkaTopic as KAFKA_TOPICS;

          await safeSend({
            topic,
            messages: [
              {
                key: event.aggregateId,
                value: event.payload,
              },
            ],
          });

          // mark as published
          await db
            .update(outbox)
            .set({
              status: 'published',
              publishedAt: new Date().toISOString(),
            })
            .where(eq(outbox.id, event.id));

          logger.debug(
            `[SUCCESS] Published outbox event ${event.id} to ${topic}`
          );
        } catch (error) {
          logger.error(
            `[ERROR] Failed to publish outbox event ${event.id}:`,
            error
          );

          // Update retry count
          await db
            .update(outbox)
            .set({
              retryCount: sql`${outbox.retryCount} + 1`,
              lastRetryAt: new Date().toISOString(),
            })
            .where(eq(outbox.id, event.id));
        }
      }
    } catch (error) {
      logger.error('Outbox publisher error:', error);
    }
  }, OUTBOX_POLL_INTERVAL);
}

// runs every 10 seconds to handle timed-out pending requests
export function startTimeoutHandler(): NodeJS.Timeout {
  logger.debug('[WORKER] Starting Timeout Handler Worker...');

  return setInterval(async () => {
    try {
      const now = new Date();
      const nowIso = now.toISOString();

      // query timed-out pending requests
      const timedOutRequests = await db
        .select()
        .from(emergencyRequest)
        .where(
          and(
            eq(emergencyRequest.requestStatus, 'pending'),
            lt(emergencyRequest.expiresAt, nowIso)
          )
        );

      if (timedOutRequests.length === 0) return;

      logger.debug(
        `[WORKER] Found ${timedOutRequests.length} timed-out requests`
      );

      const io = getIo();

      for (const req of timedOutRequests) {
        const currentRadius = req.searchRadius || 1;

        // if max radius exceeded, mark as failed
        if (currentRadius > MAX_SEARCH_RADIUS) {
          logger.debug(
            `[ERROR] Request ${req.id} failed after ${currentRadius} escalations`
          );

          await db
            .update(emergencyRequest)
            .set({ requestStatus: 'no_providers_available' })
            .where(eq(emergencyRequest.id, req.id));

          // log event
          await db.insert(requestEvents).values({
            requestId: req.id,
            eventType: 'failed-no-providers',
            metadata: { searchRadius: currentRadius },
          });

          // notify user
          if (io) {
            io.to(`user:${req.userId}`).emit(SocketEvents.EMERGENCY_FAILED, {
              requestId: req.id,
              message:
                'No emergency responders available nearby. Please call emergency services directly.',
            });
          }

          continue;
        }

        // expand search radius
        const newRadius = currentRadius + 1;
        logger.debug(`🔄 Escalating request ${req.id} to radius ${newRadius}`);

        // get h3 cell and expand search
        const location = req.location as {
          latitude: number;
          longitude: number;
        };
        const userH3 = latLngToCell(location.latitude, location.longitude, 8);
        const expandedCells = gridDisk(userH3, newRadius);

        // find new providers in expanded area
        const newProviders = await db
          .select({
            id: serviceProvider.id,
            name: serviceProvider.name,
          })
          .from(serviceProvider)
          .where(
            and(
              sql`${serviceProvider.h3Index}::text IN (${sql.raw(expandedCells.map(c => `'${c}'`).join(','))})`,
              eq(serviceProvider.serviceStatus, 'available'),
              eq(serviceProvider.serviceType, req.serviceType)
            )
          );

        // Update request with new radius and expiry.
        // Guard against races (e.g. request accepted/completed after our select).
        const newExpiresAt = new Date(Date.now() + REQUEST_TIMEOUT_MS);
        const updated = await db
          .update(emergencyRequest)
          .set({
            searchRadius: newRadius,
            expiresAt: newExpiresAt.toISOString(),
          })
          .where(
            and(
              eq(emergencyRequest.id, req.id),
              eq(emergencyRequest.requestStatus, 'pending'),
              lt(emergencyRequest.expiresAt, nowIso)
            )
          )
          .returning({ id: emergencyRequest.id });

        if (updated.length === 0) {
          logger.debug(
            `[ESCALATION] Skipping ${req.id}: status changed since select`
          );
          continue;
        }

        // log escalation event
        await db.insert(requestEvents).values({
          requestId: req.id,
          eventType: 'search-escalated',
          metadata: { newRadius, providersFound: newProviders.length },
        });

        // broadcast to newly found providers
        if (io && newProviders.length > 0) {
          for (const provider of newProviders) {
            const roomName = SocketRoom.PROVIDER(provider.id);
            logger.debug(
              `[ESCALATION] Emitting NEW_EMERGENCY for ${req.id} to ${roomName}`
            );
            io.to(roomName).emit(SocketEvents.NEW_EMERGENCY, {
              requestId: req.id,
              emergencyType: req.serviceType,
              emergencyLocation: req.location,
              urgent: true,
              escalated: true,
              searchRadius: newRadius,
              expiresAt: newExpiresAt.getTime(),
            });
          }
        }

        // notify user about expansion
        if (io) {
          io.to(`user:${req.userId}`).emit(SocketEvents.SEARCH_EXPANDED, {
            requestId: req.id,
            message: `Expanding search radius... (attempt ${newRadius}/${MAX_SEARCH_RADIUS})`,
            searchRadius: newRadius,
          });
        }
      }
    } catch (error) {
      logger.error('[ERROR] Timeout handler error:', error);
    }
  }, TIMEOUT_CHECK_INTERVAL);
}

// runs every 5 seconds to detect providers who accepted but never connected
export function startDisconnectionHandler(): NodeJS.Timeout {
  logger.debug('[CONNECTED] Starting Disconnection Handler Worker...');

  return setInterval(async () => {
    try {
      const now = new Date();
      const nowIso = now.toISOString();

      // query stale accepted requests (accepted but never connected)
      const staleRequests = await db
        .select()
        .from(emergencyRequest)
        .where(
          and(
            eq(emergencyRequest.requestStatus, 'accepted'),
            isNull(emergencyRequest.providerConnectedAt),
            lt(emergencyRequest.mustConnectBy, nowIso)
          )
        );

      if (staleRequests.length === 0) return;

      logger.debug(
        `[CONNECTED] Found ${staleRequests.length} providers who accepted but never connected`
      );

      const io = getIo();

      for (const req of staleRequests) {
        logger.debug(
          `[CONNECTED] Provider accepted request ${req.id} but never connected`
        );

        // Reset request to pending.
        // Guard against races (e.g. request completed while we were processing).
        const newExpiresAt = new Date(Date.now() + REQUEST_TIMEOUT_MS);
        const updated = await db
          .update(emergencyRequest)
          .set({
            requestStatus: 'pending',
            mustConnectBy: null,
            providerConnectedAt: null,
            expiresAt: newExpiresAt.toISOString(),
          })
          .where(
            and(
              eq(emergencyRequest.id, req.id),
              eq(emergencyRequest.requestStatus, 'accepted'),
              isNull(emergencyRequest.providerConnectedAt),
              lt(emergencyRequest.mustConnectBy, nowIso)
            )
          )
          .returning({ id: emergencyRequest.id });

        if (updated.length === 0) {
          logger.debug(
            `[REBROADCAST] Skipping ${req.id}: status changed since select`
          );
          continue;
        }

        // log event
        await db.insert(requestEvents).values({
          requestId: req.id,
          eventType: 'provider-disconnected',
          providerId: undefined,
          metadata: { reason: 'never-connected-after-accept' },
        });

        // get provider list from redis and re-broadcast
        const providerIds = await getEmergencyProviders(req.id);

        if (io && providerIds.length > 0) {
          // re-broadcast to original providers
          for (const pId of providerIds) {
            const roomName = SocketRoom.PROVIDER(pId);
            logger.debug(
              `[REBROADCAST] Emitting NEW_EMERGENCY for ${req.id} to ${roomName}`
            );
            io.to(roomName).emit(SocketEvents.NEW_EMERGENCY, {
              requestId: req.id,
              emergencyType: req.serviceType,
              emergencyLocation: req.location,
              rebroadcast: true,
              message:
                'Previous provider disconnected. Request available again.',
              expiresAt: newExpiresAt.getTime(),
            });
          }
        }

        // notify user
        if (io) {
          io.to(`user:${req.userId}`).emit(SocketEvents.PROVIDER_DISCONNECTED, {
            requestId: req.id,
            message: 'Provider lost connection. Finding another responder...',
          });
        }
      }
    } catch (error) {
      logger.error('[ERROR] Disconnection handler error:', error);
    }
  }, DISCONNECT_CHECK_INTERVAL);
}

export function startAllWorkers(): {
  outboxInterval: NodeJS.Timeout;
  timeoutInterval: NodeJS.Timeout;
  disconnectInterval: NodeJS.Timeout;
} {
  const outboxInterval = startOutboxPublisher();
  const timeoutInterval = startTimeoutHandler();
  const disconnectInterval = startDisconnectionHandler();

  logger.debug('All background workers started');

  return { outboxInterval, timeoutInterval, disconnectInterval };
}

export function stopAllWorkers(intervals: {
  outboxInterval: NodeJS.Timeout;
  timeoutInterval: NodeJS.Timeout;
  disconnectInterval: NodeJS.Timeout;
}): void {
  clearInterval(intervals.outboxInterval);
  clearInterval(intervals.timeoutInterval);
  clearInterval(intervals.disconnectInterval);

  logger.debug('All background workers stopped');
}
