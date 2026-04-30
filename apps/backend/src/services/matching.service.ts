import { serviceProvider } from '@repo/db/schemas';
import type { Coordinates } from '@repo/types/validations';

import { and, eq, inArray, sql } from 'drizzle-orm';
import { cellToLatLng, gridDisk, latLngToCell } from 'h3-js';

import { envConfig, logger } from '@/config';
import {
  AVERAGE_SPEED_KM_PER_MIN,
  type ServiceTypeEnum,
  type ServiceTypeEnumVal,
} from '@/constants';
import { RoutingProfiles } from '@/constants/mapbox.constants';
import db from '@/db';
import { constructMatrixUrl } from '@/utils/maps/mapbox';

interface IProviderInfo {
  id: string;
  distance: number;
  name: string;
  phoneNumber: number | null;
  serviceType: string;
  vehicleInformation: {
    type: string;
    number: string;
    model: string;
    color: string;
  } | null;
  h3Index: bigint | null;
}

export interface ProviderWithDistance {
  id: string;
  name: string;
  phone: string;
  serviceType: string;
  vehicleNumber: string;
  distance: number;
  eta: number;
  h3Index: string;
}

type MatrixResponse = {
  durations?: (number | null)[][];
};

// type narrowing
function isMatrixResponse(data: unknown): data is MatrixResponse {
  return (
    data !== null &&
    typeof data == 'object' &&
    'durations' in data &&
    Array.isArray((data as any).durations)
  );
}

export async function findNearbyProviders({
  lat,
  lng,
  type,
  kRingRadius,
}: {
  lat: number;
  lng: number;
  type: ServiceTypeEnumVal;
  kRingRadius: number;
}): Promise<Array<IProviderInfo>> {
  // res - how large or small hex cells are
  const h3Idx = latLngToCell(lat, lng, 8);

  // ringSize - k rings if 2 then center and its ring ?
  const nearbyCells = gridDisk(h3Idx, kRingRadius);
  const cellBigInts = nearbyCells.map(cell => BigInt(`0x${cell}`));

  // Keep as hex strings if h3Index is VARCHAR in DB
  // If BIGINT, use: nearbyCells.map(cell => sql`${BigInt(`0x${cell}`).toString()}::bigint`)
  const providers = await db
    .select({
      id: serviceProvider.id,
      distance: sql<number>`ST_Distance(
      ${serviceProvider.lastLocation}::geography, 
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    )`,
      name: serviceProvider.name,
      phoneNumber: serviceProvider.phoneNumber,
      serviceType: serviceProvider.serviceType,
      vehicleInformation: serviceProvider.vehicleInformation,
      h3Index: serviceProvider.h3Index,
    })
    .from(serviceProvider)
    .where(
      and(
        inArray(serviceProvider.h3Index, cellBigInts), // cellbigInts = bigInt[]
        eq(serviceProvider.serviceStatus, 'available'),
        eq(serviceProvider.serviceType, type)
      )
    ) // Cast to geometry for <-> KNN operator
    .orderBy(
      sql`${serviceProvider.lastLocation}::geometry <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geometry`
    )
    .limit(10);

  logger.info('Found providers', providers);
  return providers;
}

export async function getBatchETAs(
  providers: Coordinates[],
  destination: Coordinates
): Promise<(number | null)[]> {
  if (providers.length === 0) {
    return [];
  }

  try {
    const allCoords = [...providers, destination];
    const sources = providers.map((_, i) => i);
    const destinations = [providers.length];

    const url = constructMatrixUrl({
      profile: RoutingProfiles.DrivingTraffic,
      token: envConfig.mapbox_token,
      sources,
      destinations,
      coordinates: allCoords,
    });

    // Add timeout to prevent hanging on slow API responses
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.error('Failed to get matrix url', { status: response.status });
      return providers.map(() => null);
    }

    const data: unknown = await response.json();

    if (!isMatrixResponse(data) || !data.durations) {
      logger.error('Invalid matrix response shape');
      return providers.map(() => null);
    }

    return data.durations.map(row =>
      row.length > 0 && row[0] !== null && row[0] !== undefined
        ? Math.round(row[0] / 60)
        : null
    );
  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.warn('Matrix API timeout after 5 seconds');
    } else {
      logger.error('Error getting batch eta', { error: error.message });
    }
    return providers.map(() => null);
  }
}

//  Use Matrix API for sorting
export async function calculateDistancesAndSort(
  providers: Array<IProviderInfo>,
  emergencyLocation: { latitude: number; longitude: number }
): Promise<ProviderWithDistance[]> {
  const validProviders = providers
    .map(provider => {
      const h3Hex = provider.h3Index?.toString(16).padStart(15, '0');
      if (!h3Hex) return null;

      const providerLatLng = cellToLatLng(h3Hex);
      return {
        provider,
        coords: {
          lng: providerLatLng[1],
          lat: providerLatLng[0],
        },
        h3Hex,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  // Batch process in chunks of 25 (Mapbox Matrix API limit)
  const BATCH_SIZE = 25;
  const allETAs: (number | null)[] = [];

  for (let i = 0; i < validProviders.length; i += BATCH_SIZE) {
    const batch = validProviders.slice(i, i + BATCH_SIZE);
    const providerCoords = batch.map(p => p.coords);

    const etas = await getBatchETAs(providerCoords, {
      lng: emergencyLocation.longitude,
      lat: emergencyLocation.latitude,
    });

    allETAs.push(...etas);
  }

  // Map and sort results
  return validProviders
    .map(({ provider, coords, h3Hex }, index) => {
      const eta = allETAs[index];
      const distance = eta ? eta * AVERAGE_SPEED_KM_PER_MIN : 0;

      return {
        id: provider.id,
        name: provider.name,
        phone: provider.phoneNumber?.toString() ?? '',
        serviceType: provider.serviceType,
        vehicleNumber: provider.vehicleInformation?.number ?? 'Unknown',
        distance: Math.round(distance * 100) / 100,
        eta: eta || 999, // Fallback to high number if API fails
        h3Index: h3Hex,
      };
    })
    .sort((a, b) => a.eta - b.eta);
}

/**
 * Haversine formula for calculating distance between two points on Earth
 * Returns distance in kilometers
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
