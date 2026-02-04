import { envConfig, logger } from '@/config';
import { RoutingProfiles } from '@/constants/mapbox.constants';
import type { RouteResponse, RouteResult } from '@/types/maps.types';
import { constructDirectionUrl } from '@/utils/maps/mapbox';
import type { Coordinates } from '@/validations/maps.validations';

export async function getRouteFromMapbox(
  origin: Coordinates,
  destination: Coordinates,
  profile: RoutingProfiles = RoutingProfiles.DrivingTraffic,
): Promise<RouteResult> {
  try {
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
      // console.error('Mapbox API error:', response.status, errorText);
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

    return {
      success: true,
      route: {
        coordinates: route.geometry.coordinates,
        distance: Math.round((route.distance / 1000) * 100) / 100, // to km
        duration: Math.round(route.duration / 60), //  to minutes
        steps: route.legs[0]?.steps.map(step => ({
          instruction: step.maneuver.instruction,
          distance: Math.round(step.distance),
          duration: Math.round(step.duration),
        })),
      },
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
  destination: Coordinates,
): Promise<number | null> {
  const result = await getRouteFromMapbox(origin, destination);
  return result.success && result.route ? result.route.duration : null;
}

export default { getRouteFromMapbox, getETA };
