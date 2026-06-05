import { getRouteDataSchema } from '@repo/types/validations';

import { HttpStatusCode } from 'axios';
import { type Request, type Response } from 'express';

import { RoutingProfiles } from '@/constants/mapbox.constants';
import {
  forwardGeocode,
  getRouteFromMapbox,
  reverseGeocode,
} from '@/services/mapbox.service';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';

const getAutoComplete = asyncHandler(async (req: Request, res: Response) => {
  const { q: searchQuery, lat: currentLat, lg: currentLong } = req.query;

  if (
    !searchQuery ||
    typeof searchQuery !== 'string' ||
    searchQuery.length < 3
  ) {
    throw ApiError.badRequest(
      'Search query must be a string of at least 3 characters'
    );
  }

  const lat = currentLat ? parseFloat(currentLat as string) : undefined;
  const lng = currentLong ? parseFloat(currentLong as string) : undefined;

  const results = await forwardGeocode(
    searchQuery,
    lat != null && !isNaN(lat) ? lat : undefined,
    lng != null && !isNaN(lng) ? lng : undefined
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        results.length ? 'Search results found' : 'No results found',
        results
      )
    );
});

const getRoute = asyncHandler(async (req: Request, res: Response) => {
  const parsedData = getRouteDataSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res
      .status(HttpStatusCode.BadRequest)
      .json(ApiError.validationError(parsedData.error));
  }

  const { origin, dest, profile } = parsedData.data;
  const routeResult = await getRouteFromMapbox(
    origin,
    dest,
    profile as RoutingProfiles
  );

  if (!routeResult.success) {
    return res.status(HttpStatusCode.InternalServerError).json({
      error: routeResult.error,
    });
  }

  return res
    .status(HttpStatusCode.Ok)
    .json(
      new ApiResponse(
        HttpStatusCode.Ok,
        'Route Found Successfully',
        routeResult.route
      )
    );
});

const getReverseGeocode = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    throw ApiError.badRequest('lat and lng are required');
  }

  const parsedLat = parseFloat(lat as string);
  const parsedLng = parseFloat(lng as string);

  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    throw ApiError.badRequest('lat and lng must be valid numbers');
  }

  const address = await reverseGeocode(parsedLat, parsedLng);

  if (!address) {
    throw ApiError.notFound('Address not found for given coordinates');
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Address found', { address }));
});

const mapsController = {
  autocomplete: getAutoComplete,
  route: getRoute,
  reverseGeocode: getReverseGeocode,
} as const;

export default mapsController;

export { getAutoComplete, getRoute };
