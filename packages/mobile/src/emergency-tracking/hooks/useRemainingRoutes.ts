import { EmergencyStatus } from '@repo/types/constants';

import { useEffect } from 'react';
import { LatLng } from 'react-native-maps';

import {
  getRemainingRouteAfterProgress,
  haversineDistance,
} from '../../utils/location';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface UseRemainingRouteParams {
  movingParty: LocationCoords | null;
  userLocation: LocationCoords;
  routeCoordinates: LatLng[];
  currentStatus: EmergencyStatus;
  setRemainingRouteCoordinates: (coords: LatLng[]) => void;
}

export function useRemainingRoute({
  movingParty,
  userLocation,
  routeCoordinates,
  currentStatus,
  setRemainingRouteCoordinates,
}: UseRemainingRouteParams) {
  useEffect(() => {
    if (
      !movingParty ||
      routeCoordinates.length === 0 ||
      currentStatus !== EmergencyStatus.ACCEPTED
    ) {
      return;
    }

    let minDist = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < routeCoordinates.length; i++) {
      const dist = haversineDistance(
        movingParty.latitude,
        movingParty.longitude,
        routeCoordinates[i].latitude,
        routeCoordinates[i].longitude
      );
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    }

    const progress = closestIndex / (routeCoordinates.length - 1);
    const remaining = getRemainingRouteAfterProgress(
      routeCoordinates,
      progress
    );

    setRemainingRouteCoordinates([
      { latitude: movingParty.latitude, longitude: movingParty.longitude },
      ...remaining,
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
    ]);
  }, [
    movingParty,
    routeCoordinates,
    currentStatus,
    userLocation,
    setRemainingRouteCoordinates,
  ]);
}
