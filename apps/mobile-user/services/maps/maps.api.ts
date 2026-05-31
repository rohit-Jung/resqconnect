import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';
import { mapsEndpoints } from '../endPoints';

interface Coordinates {
  lat: number;
  lng: number;
}

interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

export interface RouteData {
  coordinates: [number, number][]; // [lng, lat] pairs from Mapbox
  distance: number; // in km
  duration: number; // in minutes
  steps?: RouteStep[];
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export type RoutingProfile =
  | 'driving-traffic'
  | 'driving'
  | 'walking'
  | 'cycling';

interface GetRouteParams {
  origin: Coordinates;
  dest: Coordinates;
  profile?: RoutingProfile;
}

export const useGetRoute = () => {
  return useMutation<
    AxiosResponse<ApiResponse<RouteData>>,
    AxiosError,
    GetRouteParams
  >({
    mutationFn: params => {
      // Backend expects POST with body containing origin, dest, profile
      return api.post(mapsEndpoints.getRoute, {
        origin: params.origin,
        dest: params.dest,
        profile: params.profile || 'driving-traffic',
      });
    },
  });
};

// Standalone function for fetching route (useful in effects)
export async function fetchRoute(
  params: GetRouteParams
): Promise<RouteData | null> {
  try {
    // Backend expects POST with body
    const response = await api.post<ApiResponse<RouteData>>(
      mapsEndpoints.getRoute,
      {
        origin: params.origin,
        dest: params.dest,
        profile: params.profile || 'driving-traffic',
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Error fetching route:', error);
    return null;
  }
}

export const useReverseGeocode = (lat: number | null, lng: number | null) => {
  return useQuery<string | null, AxiosError>({
    queryKey: ['reverseGeocode', lat, lng],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ address: string }>>(
        mapsEndpoints.reverseGeocode,
        { params: { lat, lng } }
      );
      return response.data?.data?.address ?? null;
    },
    enabled: lat !== null && lng !== null,
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
    retry: false,
  });
};

export interface AutocompleteResult {
  name: string;
  latitude: number;
  longitude: number;
}

export function extractResultCoords(
  result: AutocompleteResult
): { latitude: number; longitude: number } | null {
  const lat = Number(result.latitude);
  const lng = Number(result.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { latitude: lat, longitude: lng };
}

export const useAutocomplete = (
  query: string,
  lat: number | null,
  lng: number | null
) => {
  return useQuery<AutocompleteResult[], AxiosError>({
    queryKey: ['autocomplete', query, lat, lng],
    queryFn: async () => {
      const params: Record<string, any> = { q: query };
      if (lat != null && lng != null) {
        params.lat = lat;
        params.lg = lng;
      }
      const response = await api.get(mapsEndpoints.getAutocomplete, { params });
      return Array.isArray(response.data?.data) ? response.data.data : [];
    },
    enabled: query.length >= 3,
    staleTime: 30 * 1000,
    retry: false,
  });
};

// Query hook for route (auto-refetch disabled - we control when to refetch)
export const useRouteQuery = (
  origin: Coordinates | null,
  dest: Coordinates | null,
  enabled: boolean = false
) => {
  return useQuery<RouteData | null, AxiosError>({
    queryKey: ['route', origin?.lat, origin?.lng, dest?.lat, dest?.lng],
    queryFn: async () => {
      if (!origin || !dest) return null;
      return fetchRoute({ origin, dest });
    },
    enabled: enabled && !!origin && !!dest,
    staleTime: Infinity, // Don't auto-refetch
    refetchOnWindowFocus: false,
  });
};
