import { and, asc, eq, isNull, lt, sql } from 'drizzle-orm';
import { gridDisk, latLngToCell } from 'h3-js';

import { KAFKA_TOPICS } from '@/constants/kafka.constants';
import { socketEvents } from '@/constants/socket.constants';
import db from '@/db';
import {
  emergencyRequest,
  outbox,
  requestEvents,
  serviceProvider,
} from '@/models';
import { isKafkaProducerConnected, safeSend } from '@/services/kafka.service';
import {
  cacheEmergencyProviders,
  getEmergencyProviders,
} from '@/services/redis.service';
import { getIo } from '@/socket';

// Constants
const OUTBOX_POLL_INTERVAL = 1000; // 1 second
const TIMEOUT_CHECK_INTERVAL = 10000; // 10 seconds
const DISCONNECT_CHECK_INTERVAL = 5000; // 5 seconds
const MAX_SEARCH_RADIUS = 5;
const REQUEST_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const MUST_CONNECT_TIMEOUT_MS = 15000; // 15 seconds

/**
 * Get Kafka topic for outbox event type
 */
function getTopicForEventType(eventType: string): string {
  const topicMap: Record<string, string> = {
    created: KAFKA_TOPICS.EMERGENCY_CREATED,
    accepted: KAFKA_TOPICS.EMERGENCY_ACCEPTED,
    cancelled: KAFKA_TOPICS.EMERGENCY_CANCELLED,
    completed: KAFKA_TOPICS.EMERGENCY_COMPLETED,
  };
  return topicMap[eventType] || KAFKA_TOPICS.EMERGENCY_CREATED;
}

/**
 * Outbox Publisher Worker
 * Runs every 1 second to process pending outbox events
 */
export function startOutboxPublisher(): NodeJS.Timeout {
  console.log('📤 Starting Outbox Publisher Worker...');

  return setInterval(async () => {
    try {
      // Query pending outbox events
      const pendingEvents = await db
        .select()
        .from(outbox)
        .where(eq(outbox.status, 'pending'))
        .orderBy(asc(outbox.createdAt))
        .limit(100);

      if (pendingEvents.length === 0) return;

      // Check if producer is connected before processing
      if (!isKafkaProducerConnected()) {
        console.log(
          '⚠️ Kafka producer not connected, skipping outbox processing...'
        );
        return;
      }

      console.log(`📤 Processing ${pendingEvents.length} outbox events...`);

      for (const event of pendingEvents) {
        try {
          const topic = getTopicForEventType(event.eventType);

          await safeSend({
            topic,
            messages: [
              {
                key: event.aggregateId,
                value: event.payload,
              },
            ],
          });

          // Mark as published
          await db
            .update(outbox)
            .set({
              status: 'published',
              publishedAt: new Date().toISOString(),
            })
            .where(eq(outbox.id, event.id));

          console.log(`✅ Published outbox event ${event.id} to ${topic}`);
        } catch (error) {
          console.error(
            `❌ Failed to publish outbox event ${event.id}:`,
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
      console.error('❌ Outbox publisher error:', error);
    }
  }, OUTBOX_POLL_INTERVAL);
}

/**
 * Request Timeout Handler Worker
 * Runs every 10 seconds to handle timed-out pending requests
 */
export function startTimeoutHandler(): NodeJS.Timeout {
  console.log('⏰ Starting Timeout Handler Worker...');

  return setInterval(async () => {
    try {
      const now = new Date();

      // Query timed-out pending requests
      const timedOutRequests = await db
        .select()
        .from(emergencyRequest)
        .where(
          and(
            eq(emergencyRequest.requestStatus, 'pending'),
            lt(emergencyRequest.expiresAt, now.toISOString())
          )
        );

      if (timedOutRequests.length === 0) return;

      console.log(`⏰ Found ${timedOutRequests.length} timed-out requests`);

      const io = getIo();

      for (const req of timedOutRequests) {
        const currentRadius = req.searchRadius || 1;

        // If max radius exceeded, mark as failed
        if (currentRadius > MAX_SEARCH_RADIUS) {
          console.log(
            `❌ Request ${req.id} failed after ${currentRadius} escalations`
          );

          await db
            .update(emergencyRequest)
            .set({ requestStatus: 'no_providers_available' })
            .where(eq(emergencyRequest.id, req.id));

          // Log event
          await db.insert(requestEvents).values({
            requestId: req.id,
            eventType: 'failed-no-providers',
            metadata: { searchRadius: currentRadius },
          });

          // Notify user
          if (io) {
            io.to(`user:${req.userId}`).emit(socketEvents.EMERGENCY_FAILED, {
              requestId: req.id,
              message:
                'No emergency responders available nearby. Please call emergency services directly.',
            });
          }

          continue;
        }

        // Expand search radius
        const newRadius = currentRadius + 1;
        console.log(`🔄 Escalating request ${req.id} to radius ${newRadius}`);

        // Get H3 cell and expand search
        const location = req.location as {
          latitude: number;
          longitude: number;
        };
        const userH3 = latLngToCell(location.latitude, location.longitude, 8);
        const expandedCells = gridDisk(userH3, newRadius);

        // Find new providers in expanded area
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

        // Update request with new radius and expiry
        const newExpiresAt = new Date(Date.now() + REQUEST_TIMEOUT_MS);
        await db
          .update(emergencyRequest)
          .set({
            searchRadius: newRadius,
            expiresAt: newExpiresAt.toISOString(),
          })
          .where(eq(emergencyRequest.id, req.id));

        // Log escalation event
        await db.insert(requestEvents).values({
          requestId: req.id,
          eventType: 'search-escalated',
          metadata: { newRadius, providersFound: newProviders.length },
        });

        // Broadcast to newly found providers
        if (io && newProviders.length > 0) {
          for (const provider of newProviders) {
            io.to(provider.id).emit(socketEvents.NEW_EMERGENCY, {
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

        // Notify user about expansion
        if (io) {
          io.to(`user:${req.userId}`).emit(socketEvents.SEARCH_EXPANDED, {
            requestId: req.id,
            message: `Expanding search radius... (attempt ${newRadius}/${MAX_SEARCH_RADIUS})`,
            searchRadius: newRadius,
          });
        }
      }
    } catch (error) {
      console.error('❌ Timeout handler error:', error);
    }
  }, TIMEOUT_CHECK_INTERVAL);
}

/**
 * Disconnected Provider Handler Worker
 * Runs every 5 seconds to detect providers who accepted but never connected
 */
export function startDisconnectionHandler(): NodeJS.Timeout {
  console.log('🔌 Starting Disconnection Handler Worker...');

  return setInterval(async () => {
    try {
      const now = new Date();

      // Query stale accepted requests (accepted but never connected)
      const staleRequests = await db
        .select()
        .from(emergencyRequest)
        .where(
          and(
            eq(emergencyRequest.requestStatus, 'accepted'),
            isNull(emergencyRequest.providerConnectedAt),
            lt(emergencyRequest.mustConnectBy, now.toISOString())
          )
        );

      if (staleRequests.length === 0) return;

      console.log(
        `🔌 Found ${staleRequests.length} providers who accepted but never connected`
      );

      const io = getIo();

      for (const req of staleRequests) {
        console.log(
          `🔌 Provider ${req.providerId} accepted request ${req.id} but never connected`
        );

        // Reset request to pending
        const newExpiresAt = new Date(Date.now() + REQUEST_TIMEOUT_MS);
        await db
          .update(emergencyRequest)
          .set({
            requestStatus: 'pending',
            providerId: null,
            acceptedAt: null,
            mustConnectBy: null,
            providerConnectedAt: null,
            expiresAt: newExpiresAt.toISOString(),
          })
          .where(eq(emergencyRequest.id, req.id));

        // Log event
        await db.insert(requestEvents).values({
          requestId: req.id,
          eventType: 'provider-disconnected',
          providerId: req.providerId || undefined,
          metadata: { reason: 'never-connected-after-accept' },
        });

        // Get provider list from Redis and re-broadcast
        const providerIds = await getEmergencyProviders(req.id);

        if (io && providerIds.length > 0) {
          // Re-broadcast to original providers
          for (const pId of providerIds) {
            io.to(pId).emit(socketEvents.NEW_EMERGENCY, {
              requestId: req.id,
              emergencyType: req.serviceType,
              emergencyLocation: req.location,
              rebroadcast: true,
              previousProvider: req.providerId,
              message:
                'Previous provider disconnected. Request available again.',
              expiresAt: newExpiresAt.getTime(),
            });
          }
        }

        // Notify user
        if (io) {
          io.to(`user:${req.userId}`).emit(socketEvents.PROVIDER_DISCONNECTED, {
            requestId: req.id,
            message: 'Provider lost connection. Finding another responder...',
          });
        }
      }
    } catch (error) {
      console.error('❌ Disconnection handler error:', error);
    }
  }, DISCONNECT_CHECK_INTERVAL);
}

/**
 * Start all background workers
 */
export function startAllWorkers(): {
  outboxInterval: NodeJS.Timeout;
  timeoutInterval: NodeJS.Timeout;
  disconnectInterval: NodeJS.Timeout;
} {
  const outboxInterval = startOutboxPublisher();
  const timeoutInterval = startTimeoutHandler();
  const disconnectInterval = startDisconnectionHandler();

  console.log('✅ All background workers started');

  return { outboxInterval, timeoutInterval, disconnectInterval };
}

/**
 * Stop all background workers
 */
export function stopAllWorkers(intervals: {
  outboxInterval: NodeJS.Timeout;
  timeoutInterval: NodeJS.Timeout;
  disconnectInterval: NodeJS.Timeout;
}): void {
  clearInterval(intervals.outboxInterval);
  clearInterval(intervals.timeoutInterval);
  clearInterval(intervals.disconnectInterval);

  console.log('⏹️ All background workers stopped');
}
