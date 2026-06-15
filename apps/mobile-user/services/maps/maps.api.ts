import type { ApiResponse } from '@repo/types/api/responses';
import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';
import { mapsEndpoints } from '../endPoints';

interface RouteResponse {
  distance: number;
  duration: number;
  steps: Array<{ instruction: string; distance: number; duration: number }>;
}

interface GeocodeResponse {
  name: string;
  latitude: number;
  longitude: number;
}

export const fetchRoute = async (
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<{ distance: number; duration: number } | null> => {
  try {
    const res = await api.post(mapsEndpoints.getRoute, { origin, dest });
    const data = res.data as ApiResponse<RouteResponse>;
    if (data?.data) {
      return { distance: data.data.distance, duration: data.data.duration };
    }
    return null;
  } catch {
    return null;
  }
};

export const useReverseGeocode = (
  latitude: number,
  longitude: number,
  enabled: boolean = true
) => {
  return useQuery<AxiosResponse<ApiResponse<GeocodeResponse[]>>, AxiosError>({
    queryKey: ['reverseGeocode', latitude, longitude],
    queryFn: () =>
      api.get(mapsEndpoints.reverseGeocode, {
        params: { lat: latitude, lng: longitude },
      }),
    enabled: enabled && !!latitude && !!longitude,
  });
};
