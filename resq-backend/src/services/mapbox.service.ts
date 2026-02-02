/**
 * Mapbox Directions API Service
 * Used to calculate routes between provider and user locations
 */

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface RouteResponse {
  routes: Array<{
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
    legs: Array<{
      distance: number; // in meters
      duration: number; // in seconds
      steps: Array<{
        distance: number;
        duration: number;
        geometry: {
          coordinates: [number, number][];
        };
        maneuver: {
          instruction: string;
          type: string;
          modifier?: string;
          location: [number, number];
        };
        name: string;
      }>;
    }>;
    distance: number;
    duration: number;
  }>;
  waypoints: Array<{
    location: [number, number];
    name: string;
  }>;
}

interface RouteResult {
  success: boolean;
  route?: {
    coordinates: [number, number][];
    distance: number; // in km
    duration: number; // in minutes
    steps?: Array<{
      instruction: string;
      distance: number;
      duration: number;
    }>;
  };
  error?: string;
}

/**
 * Get route from Mapbox Directions API
 * @param origin - Provider's current location
 * @param destination - User's emergency location
 * @param profile - Routing profile (driving, walking, cycling)
 */
export async function getRoute(
  origin: Coordinates,
  destination: Coordinates,
  profile: 'driving' | 'walking' | 'cycling' | 'driving-traffic' = 'driving-traffic'
): Promise<RouteResult> {
  const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

  if (!MAPBOX_ACCESS_TOKEN) {
    console.error('MAPBOX_ACCESS_TOKEN is not set in environment variables');
    return {
      success: false,
      error: 'Mapbox API key not configured',
    };
  }

  try {
    // Mapbox expects coordinates as longitude,latitude
    const originStr = `${origin.longitude},${origin.latitude}`;
    const destinationStr = `${destination.longitude},${destination.latitude}`;

    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${originStr};${destinationStr}?geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_ACCESS_TOKEN}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox API error:', response.status, errorText);
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
        distance: Math.round((route.distance / 1000) * 100) / 100, // Convert to km, round to 2 decimals
        duration: Math.round(route.duration / 60), // Convert to minutes
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

/**
 * Get estimated time of arrival (ETA) in minutes
 */
export async function getETA(
  origin: Coordinates,
  destination: Coordinates
): Promise<number | null> {
  const result = await getRoute(origin, destination);
  return result.success && result.route ? result.route.duration : null;
}

export default { getRoute, getETA };
