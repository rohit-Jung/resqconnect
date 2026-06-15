import type { ApiResponse } from '@repo/types/api/responses';
import { useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import api from '../axiosInstance';
import { mapsEndpoints } from '../endPoints';

interface RouteResponse {
  distance: number;
  duration: number;
  steps: Array<{ instruction: string; distance: number; duration: number }>;
}

export const useGetRoute = (
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
  enabled: boolean = true
) => {
  return useQuery<AxiosResponse<ApiResponse<RouteResponse>>, AxiosError>({
    queryKey: ['route', origin, dest],
    queryFn: () => api.post(mapsEndpoints.getRoute, { origin, dest }),
    enabled,
  });
};
