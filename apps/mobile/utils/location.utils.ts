/**
 * Calculate the Haversine distance between two coordinates in meters
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if movement is significant enough to refetch route (default 50m)
 */
export function isSignificantMovement(
  prevLat: number,
  prevLng: number,
  newLat: number,
  newLng: number,
  thresholdMeters: number = 50
): boolean {
  const distance = haversineDistance(prevLat, prevLng, newLat, newLng);
  return distance >= thresholdMeters;
}

/**
 * Convert Mapbox polyline coordinates [lng, lat] to react-native-maps format { latitude, longitude }
 */
export function mapboxToLatLng(
  coordinates: [number, number][]
): { latitude: number; longitude: number }[] {
  return coordinates.map(([lng, lat]) => ({
    latitude: lat,
    longitude: lng,
  }));
}

/**
 * Calculate bearing between two points (for marker rotation)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);

  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Format duration in minutes to human readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 1) {
    return 'Less than 1 min';
  }
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Format distance in km to human readable format
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(1)}km`;
}

/**
 * Get center point between two coordinates
 */
export function getCenterPoint(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): { latitude: number; longitude: number } {
  return {
    latitude: (lat1 + lat2) / 2,
    longitude: (lng1 + lng2) / 2,
  };
}

/**
 * Calculate delta for map region based on two points
 */
export function getRegionForCoordinates(
  coordinates: { latitude: number; longitude: number }[],
  padding: number = 1.5
): {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
} {
  if (coordinates.length === 0) {
    return {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }

  let minLat = coordinates[0].latitude;
  let maxLat = coordinates[0].latitude;
  let minLng = coordinates[0].longitude;
  let maxLng = coordinates[0].longitude;

  coordinates.forEach(coord => {
    minLat = Math.min(minLat, coord.latitude);
    maxLat = Math.max(maxLat, coord.latitude);
    minLng = Math.min(minLng, coord.longitude);
    maxLng = Math.max(maxLng, coord.longitude);
  });

  const latDelta = (maxLat - minLat) * padding;
  const lngDelta = (maxLng - minLng) * padding;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(latDelta, 0.01),
    longitudeDelta: Math.max(lngDelta, 0.01),
  };
}
