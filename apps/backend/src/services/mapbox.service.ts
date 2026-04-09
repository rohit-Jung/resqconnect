import { envConfig, logger } from '@/config';
import { RoutingProfiles } from '@/constants/mapbox.constants';
import { cacheRoute, getCachedRoute } from '@/services/redis.service';
import type { RouteResponse, RouteResult } from '@/types/maps.types';
import { constructDirectionUrl } from '@/utils/maps/mapbox';
import type { Coordinates } from '@/validations/maps.validations';

export async function getRouteFromMapbox(
  origin: Coordinates,
  destination: Coordinates,
  profile: RoutingProfiles = RoutingProfiles.DrivingTraffic
): Promise<RouteResult> {
  try {
    // Check cache first
    const cachedRoute = await getCachedRoute(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng,
      profile
    );

    if (cachedRoute) {
      console.log('[ROUTE_CACHE] Using cached route instead of API call');
      return {
        success: true,
        route: cachedRoute,
      };
    }

    const url = constructDirectionUrl({
      profile,
      token: envConfig.mapbox_token,
      origin,
      dest: destination,
    });

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Mapbox API error: ${response.status} ${errorText}`);
      return {
        success: false,
        error: `Mapbox API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as RouteResponse;
    if (!data.routes || data.routes.length === 0) {
      return {
        success: false,
        error: 'No route found',
      };
    }

    const route = data.routes[0];

    if (!route) {
      return {
        success: false,
        error: 'No route found',
      };
    }

    const processedRoute = {
      coordinates: route.geometry.coordinates,
      distance: Math.round((route.distance / 1000) * 100) / 100, // to km
      duration: Math.round(route.duration / 60), //  to minutes
      steps: route.legs[0]?.steps.map(step => ({
        instruction: step.maneuver.instruction,
        distance: Math.round(step.distance),
        duration: Math.round(step.duration),
      })),
    };

    // Cache the route for future use
    await cacheRoute(
      origin.lat,
      origin.lng,
      destination.lat,
      destination.lng,
      profile,
      processedRoute
    );

    return {
      success: true,
      route: processedRoute,
    };
  } catch (error) {
    console.error('Error fetching route from Mapbox:', error);
    return {
      success: false,
      error: 'Failed to fetch route',
    };
  }
}

export async function getETA(
  origin: Coordinates,
  destination: Coordinates
): Promise<number | null> {
  const result = await getRouteFromMapbox(origin, destination);
  return result.success && result.route ? result.route.duration : null;
}

export async function getBatchETAs(
  origins: Coordinates[],
  destination: Coordinates
): Promise<(number | null)[]> {
  try {
    // Mapbox Matrix API allows up to 25 locations per request
    const coordinates = [
      ...origins.map(o => `${o.lng},${o.lat}`),
      `${destination.lng},${destination.lat}`,
    ].join(';');

    const destinationIndex = origins.length; // Last coordinate is destination
    const sources = origins.map((_, i) => i).join(';'); // All origins

    const url = `https://api.mapbox.com/directions-matrix/v1/mapbox/driving-traffic/${coordinates}?sources=${sources}&destinations=${destinationIndex}&annotations=duration&access_token=${envConfig.mapbox_token}`;

    const response = await fetch(url);

    if (!response.ok) {
      logger.error('Mapbox Matrix API error:', response.status);
      return origins.map(() => null);
    }

    const data = (await response.json()) as { durations?: number[][] | null };

    // Extract durations (in seconds) and convert to minutes
    const durations = data.durations || [];
    return durations.map((row: number[]) =>
      (row?.[0] ?? null) !== null ? Math.round((row[0] as number) / 60) : null
    );
  } catch (error) {
    logger.error('Error fetching batch ETAs:', error);
    return origins.map(() => null);
  }
}

export default { getRouteFromMapbox, getETA };
