export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
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

export function isSignificantMovement(
  prevLat: number,
  prevLng: number,
  newLat: number,
  newLng: number,
  thresholdMeters: number = 50
): boolean {
  return haversineDistance(prevLat, prevLng, newLat, newLng) >= thresholdMeters;
}

export function mapboxToLatLng(
  coordinates: [number, number][]
): { latitude: number; longitude: number }[] {
  return coordinates.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

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

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return 'Less than 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

type Coord = { latitude: number; longitude: number };

export function getRemainingRouteAfterProgress(
  coordinates: Coord[],
  progress: number
): Coord[] {
  if (coordinates.length < 2) return coordinates;

  const p = Math.max(0, Math.min(1, progress));

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

  const targetDistance = totalDistance * p;

  let segmentIndex = 0;
  for (let i = 1; i < distances.length; i++) {
    if (distances[i] >= targetDistance) {
      segmentIndex = i - 1;
      break;
    }
  }

  const remaining: Coord[] = [];
  const prevDist = distances[segmentIndex];
  const currDist = distances[segmentIndex + 1];
  const segmentDist = currDist - prevDist;

  if (segmentDist > 0) {
    const ratio = (targetDistance - prevDist) / segmentDist;
    const lat1 = coordinates[segmentIndex].latitude;
    const lng1 = coordinates[segmentIndex].longitude;
    const lat2 = coordinates[segmentIndex + 1].latitude;
    const lng2 = coordinates[segmentIndex + 1].longitude;
    remaining.push({
      latitude: lat1 + (lat2 - lat1) * ratio,
      longitude: lng1 + (lng2 - lng1) * ratio,
    });
  } else if (segmentIndex < coordinates.length) {
    remaining.push(coordinates[segmentIndex]);
  }

  for (let i = segmentIndex + 1; i < coordinates.length; i++) {
    remaining.push(coordinates[i]);
  }

  return remaining;
}

export function getPointAtProgress(
  coordinates: Coord[],
  progress: number
): Coord | null {
  if (coordinates.length < 2) return null;

  const p = Math.max(0, Math.min(1, progress));

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

  const targetDistance = totalDistance * p;

  for (let i = 1; i < distances.length; i++) {
    if (distances[i] >= targetDistance) {
      const prevDist = distances[i - 1];
      const currDist = distances[i];
      const segmentDist = currDist - prevDist;

      if (segmentDist === 0) return coordinates[i];

      const ratio = (targetDistance - prevDist) / segmentDist;
      return {
        latitude:
          coordinates[i - 1].latitude +
          (coordinates[i].latitude - coordinates[i - 1].latitude) * ratio,
        longitude:
          coordinates[i - 1].longitude +
          (coordinates[i].longitude - coordinates[i - 1].longitude) * ratio,
      };
    }
  }

  return coordinates[coordinates.length - 1];
}

export function getRegionForCoordinates(
  coordinates: Coord[],
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

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * padding, 0.01),
    longitudeDelta: Math.max((maxLng - minLng) * padding, 0.01),
  };
}
