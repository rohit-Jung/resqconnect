import { and, eq } from 'drizzle-orm';

import { serviceTypeEnum } from '@/constants';
import db from '@/db';
import { serviceProvider } from '@/models';

interface LatLng {
  latitude: number;
  longitude: number;
}

// Simple distance calculation using lat/long differences
// Returns distance in meters
function calculateDistance(coord1: LatLng, coord2: LatLng): number {
  // Convert lat/long differences to meters
  // 1 degree of latitude ≈ 111,111 meters
  // 1 degree of longitude ≈ 111,111 * cos(latitude) meters
  const latDiff = Math.abs(coord1.latitude - coord2.latitude) * 111111;
  const longDiff =
    Math.abs(coord1.longitude - coord2.longitude) *
    111111 *
    Math.cos((coord1.latitude * Math.PI) / 180);

  // Use Pythagorean theorem to get straight-line distance
  return Math.sqrt(latDiff * latDiff + longDiff * longDiff);
}

async function findNearbyProvider(
  userLocation: LatLng,
  maxDistance: number,
  serviceType: (typeof serviceTypeEnum.enumValues)[number]
) {
  console.log('[DEBUG] Searching for providers with params:', {
    userLocation,
    maxDistance,
    serviceType,
  });

  const allAvailableProviders = await db.query.serviceProvider.findMany({
    where: and(
      eq(serviceProvider.serviceStatus, 'available'),
      eq(serviceProvider.serviceType, serviceType)
    ),
  });

  console.log(
    '[DEBUG] Found available providers matching type & status:',
    allAvailableProviders.length
  );
  console.log(
    '[DEBUG] Available providers details:',
    allAvailableProviders.map(p => ({
      id: p.id,
      name: p.name,
      serviceType: p.serviceType,
      status: p.serviceStatus,
      location: p.currentLocation,
    }))
  );

  const nearbyProviders = allAvailableProviders.filter(provider => {
    const loc = provider.currentLocation;

    if (!loc || !loc.latitude || !loc.longitude) {
      console.log('[DEBUG] Provider has invalid or missing location:', {
        id: provider.id,
        location: loc,
      });
      return false;
    }

    const providerLocation: LatLng = {
      latitude: parseFloat(loc.latitude),
      longitude: parseFloat(loc.longitude),
    };

    const distance = calculateDistance(userLocation, providerLocation);

    const isWithinRange = distance <= maxDistance;
    console.log('[DEBUG] Provider distance:', {
      id: provider.id,
      distance,
      maxDistance,
      isWithinRange,
    });

    return isWithinRange;
  });

  console.log('[DEBUG] Found nearby providers:', nearbyProviders.length);

  nearbyProviders.sort((a, b) => {
    const distA = calculateDistance(userLocation, {
      latitude: parseFloat(a.currentLocation?.latitude ?? '0'),
      longitude: parseFloat(a.currentLocation?.longitude ?? '0'),
    });

    const distB = calculateDistance(userLocation, {
      latitude: parseFloat(b.currentLocation?.latitude ?? '0'),
      longitude: parseFloat(b.currentLocation?.longitude ?? '0'),
    });

    return distA - distB;
  });

  return nearbyProviders;
}

async function getBestServiceProvider(
  userLocation: LatLng,
  serviceType: (typeof serviceTypeEnum.enumValues)[number]
) {
  console.log('[DEBUG] Starting provider search with:', {
    userLocation,
    serviceType,
  });

  // Using smaller radii since we're using a simpler distance calculation
  const radii = [200, 500, 1000, 2000, 5000];

  for (const radius of radii) {
    console.log(`[DEBUG] Searching within ${radius}m radius`);
    const candidates = await findNearbyProvider(userLocation, radius, serviceType);
    if (candidates.length > 0) {
      const best = candidates[0];
      if (best) {
        console.log('[DEBUG] Found provider within radius:', {
          radius,
          provider: {
            id: best.id,
            name: best.name,
            location: best.currentLocation,
          },
        });
        return best;
      }
    }
  }

  // Optional fallback
  if (process.env.NODE_ENV === 'development') {
    const fallbackProvider = await db.query.serviceProvider.findFirst({
      where: and(
        eq(serviceProvider.serviceStatus, 'available'),
        eq(serviceProvider.serviceType, serviceType)
      ),
    });
    console.log('[DEBUG] Fallback provider:', fallbackProvider);
    return fallbackProvider;
  }

  console.log('[DEBUG] No providers found within all defined radii.');
  return null;
}

export { getBestServiceProvider, calculateDistance };
