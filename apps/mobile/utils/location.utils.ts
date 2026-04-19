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
 * Get remaining route coordinates after a certain progress point
 * Useful for trimming polyline as provider moves along route
 */
export function getRemainingRouteAfterProgress(
  coordinates: { latitude: number; longitude: number }[],
  progress: number // 0 to 1
): { latitude: number; longitude: number }[] {
  if (coordinates.length < 2) return coordinates;

  // Clamp progress to 0-1
  const p = Math.max(0, Math.min(1, progress));

  // Calculate total distance
  let totalDistance = 0;
  const distances: number[] = [0];

  for (let i = 1; i < coordinates.length; i++) {
    const dist = haversineDistance(
      coordinates[i - 1].latitude,
      coordinates[i - 1].longitude,
      coordinates[i].latitude,
      coordinates[i].longitude
    );
    totalDistance += dist;
    distances.push(totalDistance);
  }

  // Find target distance based on progress
  const targetDistance = totalDistance * p;

  // Find the segment we're on
  let segmentIndex = 0;
  for (let i = 1; i < distances.length; i++) {
    if (distances[i] >= targetDistance) {
      segmentIndex = i - 1;
      break;
    }
  }

  // Get the point at progress
  const prevDist = distances[segmentIndex];
  const currDist = distances[segmentIndex + 1];
  const segmentDist = currDist - prevDist;

  const remaining: { latitude: number; longitude: number }[] = [];

  if (segmentDist > 0) {
    const ratio = (targetDistance - prevDist) / segmentDist;
    const lat1 = coordinates[segmentIndex].latitude;
    const lng1 = coordinates[segmentIndex].longitude;
    const lat2 = coordinates[segmentIndex + 1].latitude;
    const lng2 = coordinates[segmentIndex + 1].longitude;

    // Add interpolated point (current location)
    remaining.push({
      latitude: lat1 + (lat2 - lat1) * ratio,
      longitude: lng1 + (lng2 - lng1) * ratio,
    });
  } else if (segmentIndex < coordinates.length) {
    remaining.push(coordinates[segmentIndex]);
  }

  // Add remaining coordinates after current segment
  for (let i = segmentIndex + 1; i < coordinates.length; i++) {
    remaining.push(coordinates[i]);
  }

  return remaining;
}

/**
 * Calculate a point along a route at a specific progress (0-1)
 * Used for simulating location movement along a calculated route
 */
export function getPointAtProgress(
  coordinates: { latitude: number; longitude: number }[],
  progress: number // 0 to 1
): { latitude: number; longitude: number } | null {
  if (coordinates.length < 2) return null;

  // Clamp progress to 0-1
  const p = Math.max(0, Math.min(1, progress));

  // Calculate total distance
  let totalDistance = 0;
  const distances: number[] = [0];

  for (let i = 1; i < coordinates.length; i++) {
    const dist = haversineDistance(
      coordinates[i - 1].latitude,
      coordinates[i - 1].longitude,
      coordinates[i].latitude,
      coordinates[i].longitude
    );
    totalDistance += dist;
    distances.push(totalDistance);
  }

  // Find target distance based on progress
  const targetDistance = totalDistance * p;

  // Find the segment we're on
  for (let i = 1; i < distances.length; i++) {
    if (distances[i] >= targetDistance) {
      const prevDist = distances[i - 1];
      const currDist = distances[i];
      const segmentDist = currDist - prevDist;

      if (segmentDist === 0) {
        // Points are the same, return current
        return coordinates[i];
      }

      // Interpolate between points
      const ratio = (targetDistance - prevDist) / segmentDist;
      const lat1 = coordinates[i - 1].latitude;
      const lng1 = coordinates[i - 1].longitude;
      const lat2 = coordinates[i].latitude;
      const lng2 = coordinates[i].longitude;

      return {
        latitude: lat1 + (lat2 - lat1) * ratio,
        longitude: lng1 + (lng2 - lng1) * ratio,
      };
    }
  }

  // Return end point
  return coordinates[coordinates.length - 1];
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
