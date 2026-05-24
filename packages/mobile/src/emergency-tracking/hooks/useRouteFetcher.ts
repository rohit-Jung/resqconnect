import { LOCATION_TRACKING } from '@repo/mobile/emergency-tracking/constants';

import { useCallback, useRef } from 'react';
import { LatLng } from 'react-native-maps';

import { haversineDistance, mapboxToLatLng } from '../../utils/location';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface LatLngLiteral {
  lat: number;
  lng: number;
}

export type FetchRouteFn = (params: {
  origin: LatLngLiteral;
  dest: LatLngLiteral;
}) => Promise<{
  coordinates: [number, number][];
  distance: number;
  duration: number;
} | null>;

interface UseRouteFetcherParams {
  routeOrigin: LatLngLiteral | null;
  routeDestination: LatLngLiteral | null;
  userLocation: LocationCoords;
  fetchRoute: FetchRouteFn;
  isSimulatingRef: React.MutableRefObject<boolean>;
  simulationProgressRef: React.MutableRefObject<number>;
  setRouteCoordinates: (coords: LatLng[]) => void;
  setRemainingRouteCoordinates: (coords: LatLng[]) => void;
  setRouteInfo: (info: { distance: number; duration: number }) => void;
  setIsLoadingRoute: (loading: boolean) => void;
}

export function useRouteFetcher({
  routeOrigin,
  routeDestination,
  userLocation,
  fetchRoute,
  isSimulatingRef,
  simulationProgressRef,
  setRouteCoordinates,
  setRemainingRouteCoordinates,
  setRouteInfo,
  setIsLoadingRoute,
}: UseRouteFetcherParams) {
  const isRouteRefetchingRef = useRef(false);
  const lastRouteFetchLocation = useRef<LocationCoords | null>(null);

  const fetchAndUpdateRoute = useCallback(async () => {
    if (!routeOrigin || !routeDestination) return;
    if (isRouteRefetchingRef.current) return;
    if (isSimulatingRef.current) return;

    if (lastRouteFetchLocation.current) {
      const moved = haversineDistance(
        lastRouteFetchLocation.current.latitude,
        lastRouteFetchLocation.current.longitude,
        routeOrigin.lat,
        routeOrigin.lng
      );
      if (moved < LOCATION_TRACKING.ROUTE_REFETCH_THRESHOLD) return;
    }

    isRouteRefetchingRef.current = true;
    setIsLoadingRoute(true);

    try {
      const route = await fetchRoute({
        origin: routeOrigin,
        dest: routeDestination,
      });

      if (route) {
        const coords = mapboxToLatLng(route.coordinates);
        setRouteCoordinates(coords);

        setRemainingRouteCoordinates([
          { latitude: routeOrigin.lat, longitude: routeOrigin.lng },
          ...coords,
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          },
        ]);

        simulationProgressRef.current = 0;
        setRouteInfo({ distance: route.distance, duration: route.duration });
        lastRouteFetchLocation.current = {
          latitude: routeOrigin.lat,
          longitude: routeOrigin.lng,
        };
      }
    } catch (error) {
      console.error('[useRouteFetcher] Error fetching route:', error);
    } finally {
      setIsLoadingRoute(false);
      isRouteRefetchingRef.current = false;
    }
  }, [
    routeOrigin,
    routeDestination,
    userLocation,
    fetchRoute,
    isSimulatingRef,
    simulationProgressRef,
    setRouteCoordinates,
    setRemainingRouteCoordinates,
    setRouteInfo,
    setIsLoadingRoute,
  ]);

  return { fetchAndUpdateRoute };
}
