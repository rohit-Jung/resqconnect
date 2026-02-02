import { and, eq, sql } from 'drizzle-orm';
import { cellToLatLng, greatCircleDistance, gridDisk, latLngToCell } from 'h3-js';
import type { Server } from 'socket.io';

import { KAFKA_TOPICS } from '@/constants/kafka.constants';
import { socketEvents } from '@/constants/socket.constants';
import db from '@/db';
import { emergencyRequest, requestEvents, serviceProvider } from '@/models';
import { consumer } from '@/services/kafka.service';
import {
  acquireLock,
  cacheEmergencyProviders,
  cacheProviderLocation,
  getEmergencyProviders,
  releaseLock,
} from '@/services/redis.service';
import { getIo } from '@/socket';

// Constants
const H3_RESOLUTION = 8;
const INITIAL_K_RING_RADIUS = 1;
const EXPANDED_K_RING_RADIUS = 2;
const MAX_PROVIDERS_TO_BROADCAST = 10;
const AVERAGE_SPEED_KM_PER_MIN = 0.5; // 30 km/h
const REQUEST_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const MUST_CONNECT_TIMEOUT_MS = 15000; // 15 seconds

interface EmergencyPayload {
  requestId: string;
  userId: string;
  emergencyType: string;
  emergencyDescription?: string;
  emergencyLocation: { latitude: number; longitude: number };
  status: string;
  h3Index: string;
  searchRadius: number;
  expiresAt: string;
}

interface ProviderWithDistance {
  id: string;
  name: string;
  phone?: string;
  serviceType: string;
  vehicleNumber?: string;
  distance: number;
  eta: number;
  h3Index: string;
}

/**
 * Find nearby providers using H3 k-ring search
 */
async function findNearbyProvidersH3(
  centerH3: string,
  emergencyType: string,
  kRingRadius: number
): Promise<
  Array<{
    id: string;
    name: string;
    phoneNumber: number;
    serviceType: string;
    vehicleInformation: {
      type: string;
      number: string;
      model: string;
      color: string;
    } | null;
    h3Index: bigint | null;
  }>
> {
  // Get all cells in k-ring
  const searchCells = gridDisk(centerH3, kRingRadius);

  console.log(`🔍 Searching ${searchCells.length} H3 cells at radius ${kRingRadius}`);

  // Convert H3 hex strings to BigInt for comparison
  const cellBigInts = searchCells.map(cell => BigInt(`0x${cell}`));

  // Query database for available providers in these cells
  const providers = await db
    .select({
      id: serviceProvider.id,
      name: serviceProvider.name,
      phoneNumber: serviceProvider.phoneNumber,
      serviceType: serviceProvider.serviceType,
      vehicleInformation: serviceProvider.vehicleInformation,
      h3Index: serviceProvider.h3Index,
    })
    .from(serviceProvider)
    .where(
      and(
        sql`${serviceProvider.h3Index} IN (${sql.join(
          cellBigInts.map(b => sql`${b}`),
          sql`, `
        )})`,
        eq(serviceProvider.serviceStatus, 'available'),
        eq(serviceProvider.serviceType, emergencyType as any)
      )
    );

  return providers;
}

/**
 * Calculate distance and ETA for providers
 */
function calculateDistancesAndSort(
  providers: Array<{
    id: string;
    name: string;
    phoneNumber: number;
    serviceType: string;
    vehicleInformation: {
      type: string;
      number: string;
      model: string;
      color: string;
    } | null;
    h3Index: bigint | null;
  }>,
  emergencyLocation: { latitude: number; longitude: number }
): ProviderWithDistance[] {
  return providers
    .map(provider => {
      // Convert BigInt h3Index back to hex string
      const h3Hex = provider.h3Index ? provider.h3Index.toString(16).padStart(15, '0') : null;

      let distance = 0;
      let eta = 0;

      if (h3Hex) {
        const providerLatLng = cellToLatLng(h3Hex);
        distance = greatCircleDistance(
          [emergencyLocation.latitude, emergencyLocation.longitude],
          providerLatLng,
          'km'
        );
        eta = Math.ceil(distance / AVERAGE_SPEED_KM_PER_MIN);
      }

      return {
        id: provider.id,
        name: provider.name,
        phone: provider.phoneNumber.toString(),
        serviceType: provider.serviceType,
        vehicleNumber: provider.vehicleInformation?.number || undefined,
        distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
        eta,
        h3Index: h3Hex || '',
      };
    })
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Start the emergency request Kafka consumer
 */
async function startEmergencyRequestService() {
  await consumer.connect();
  await consumer.subscribe({ topic: KAFKA_TOPICS.EMERGENCY_CREATED });

  console.log('🚀 Emergency Request Kafka Consumer started');

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const payload: EmergencyPayload = JSON.parse(message.value!.toString());

        const {
          requestId,
          userId,
          emergencyType,
          emergencyDescription,
          emergencyLocation,
          h3Index,
        } = payload;

        console.log(`📨 Processing emergency request ${requestId}`);

        // Convert emergency location to H3 index if not provided
        const userH3 =
          h3Index ||
          latLngToCell(emergencyLocation.latitude, emergencyLocation.longitude, H3_RESOLUTION);

        // Search for available providers
        let providers = await findNearbyProvidersH3(userH3, emergencyType, INITIAL_K_RING_RADIUS);

        // If < 3 providers found, expand to k-ring radius 2
        if (providers.length < 3) {
          console.log(
            `📍 Only ${providers.length} providers in radius ${INITIAL_K_RING_RADIUS}, expanding to radius ${EXPANDED_K_RING_RADIUS}`
          );
          providers = await findNearbyProvidersH3(userH3, emergencyType, EXPANDED_K_RING_RADIUS);
        }

        const io = getIo();

        // If NO providers found
        if (providers.length === 0) {
          console.log(`❌ No providers available for request ${requestId}`);

          // Log event
          await db.insert(requestEvents).values({
            requestId,
            eventType: 'no-providers-initial',
            metadata: { searchRadius: EXPANDED_K_RING_RADIUS },
          });

          // Request will timeout and be handled by timeout handler
          return;
        }

        // Calculate distances and sort
        const providersWithDistance = calculateDistancesAndSort(providers, emergencyLocation);

        // Take top 10 providers
        const top10Providers = providersWithDistance.slice(0, MAX_PROVIDERS_TO_BROADCAST);

        // Store providers in Redis cache
        await cacheEmergencyProviders(
          requestId,
          top10Providers.map(p => p.id)
        );

        // Log event
        await db.insert(requestEvents).values({
          requestId,
          eventType: 'providers-found',
          metadata: {
            totalFound: providers.length,
            broadcasted: top10Providers.length,
          },
        });

        if (!io) {
          console.error('❌ Socket.IO not initialized');
          return;
        }

        // Emit to requestor's frontend - show available providers
        io.to(`user:${userId}`).emit(socketEvents.EMERGENCY_PROVIDERS, {
          requestId,
          providers: top10Providers.map(p => ({
            id: p.id,
            name: p.name,
            serviceType: p.serviceType,
            distance: p.distance,
            eta: p.eta,
          })),
        });

        console.log(`👤 Showing ${top10Providers.length} providers to user ${userId}`);

        // Broadcast to all providers (emit to both provider.id and provider:${provider.id} rooms)
        for (const provider of top10Providers) {
          io.to(provider.id)
            .to(`provider:${provider.id}`)
            .emit(socketEvents.NEW_EMERGENCY, {
              requestId,
              userId,
              emergencyType,
              emergencyDescription,
              emergencyLocation,
              distance: provider.distance,
              eta: provider.eta,
              expiresAt: Date.now() + REQUEST_TIMEOUT_MS,
            });
        }

        console.log(`📢 Broadcasted emergency ${requestId} to ${top10Providers.length} providers`);
      } catch (error) {
        console.error('❌ Error processing emergency request:', error);
      }
    },
  });
}

/**
 * Wait for provider response (legacy - now using socket events directly)
 */
async function waitForProvider({
  io,
  requestId,
  providerId,
  timeoutMs = 60_000,
}: {
  io: Server;
  requestId: string;
  providerId: string;
  timeoutMs?: number;
}): Promise<'ACCEPTED' | 'REJECTED' | 'TIMEOUT'> {
  return new Promise((res, _) => {
    const timer = setTimeout(() => {
      cleanup();
      res('TIMEOUT');
    }, timeoutMs);

    const handler = (payload: {
      requestId: string;
      providerId: string;
      decision: 'ACCEPTED' | 'REJECTED';
    }) => {
      if (payload.requestId == requestId && payload.providerId == providerId) {
        cleanup();
        res(payload.decision);
      }
    };

    function cleanup() {
      clearTimeout(timer);
      io.off(socketEvents.PROVIDER_DECISION, handler);
    }

    io.on(socketEvents.PROVIDER_DECISION, handler);
  });
}

export { startEmergencyRequestService };
