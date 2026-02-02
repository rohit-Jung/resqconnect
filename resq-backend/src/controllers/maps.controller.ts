import { eq } from 'drizzle-orm';
import { type Request, type Response } from 'express';

import db from '@/db';
import { user } from '@/models';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { compeletAutoSearch, getOptimalRoute } from '@/utils/maps/galli-maps';

const getAutoComplete = asyncHandler(async (req: Request, res: Response) => {
  const { q: searchQuery, lat: currentLat, lg: currentLong } = req.query;

  if (!searchQuery || searchQuery === '') {
    throw new ApiError(400, 'Search query is required');
  }

  if (typeof searchQuery !== 'string') {
    throw new ApiError(400, 'Search query must be a string');
  }

  if (
    (currentLat && typeof currentLat !== 'string') ||
    (currentLong && typeof currentLong !== 'string')
  ) {
    throw new ApiError(400, 'Current latitude and longitude must be strings');
  }

  if (searchQuery.length < 3) {
    throw new ApiError(400, 'Search query must be at least 3 characters long');
  }

  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    throw new ApiError(400, 'Unauthorized to perform this action');
  }

  let userLat, userLong, searchAutoCompleteResult;
  if (!currentLat || !currentLong) {
    const userInDb = await db.query.user.findFirst({
      where: eq(user.id, loggedInUser.id),
    });

    if (!userInDb) {
      throw new ApiError(404, 'User not found');
    }

    userLat = userInDb?.currentLocation?.latitude;
    userLong = userInDb?.currentLocation?.longitude;

    if (!userLat || !userLong) {
      throw new ApiError(404, 'User location not found');
    }

    searchAutoCompleteResult = await compeletAutoSearch({
      searchQuery,
      currentLat: userLat,
      currentLong: userLong,
    });
  } else {
    searchAutoCompleteResult = await compeletAutoSearch({
      searchQuery,
      currentLat,
      currentLong,
    });
  }

  if (!searchAutoCompleteResult) {
    throw new ApiError(404, 'No results found');
  }

  res.status(200).json(new ApiResponse(200, 'Search results found', searchAutoCompleteResult));
});

const getOptimalRouteForUser = asyncHandler(async (req: Request, res: Response) => {
  const { srcLat, srcLng, dstLat, dstLng, mode } = req.query;

  if (!srcLat || !srcLng || !dstLat || !dstLng) {
    throw new ApiError(400, 'Source and destination coordinates are required');
  }

  if (
    typeof srcLat !== 'string' ||
    typeof srcLng !== 'string' ||
    typeof dstLat !== 'string' ||
    typeof dstLng !== 'string' ||
    typeof mode !== 'string'
  ) {
    throw new ApiError(400, 'Source and destination coordinates must be strings');
  }

  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    throw new ApiError(400, 'Unauthorized to perform this action');
  }

  if (mode) {
    if (mode !== 'DRIVING' && mode !== 'WALKING' && mode !== 'BICYCLING') {
      throw new ApiError(400, 'Invalid mode parameter');
    }
  }

  const optimalRoute = await getOptimalRoute({
    srcLat,
    srcLng,
    dstLat,
    dstLng,
    mode: (mode || 'DRIVING') as 'DRIVING' | 'WALKING' | 'CYCLING',
  });

  if (!optimalRoute) {
    throw new ApiError(404, 'No route found');
  }

  res.status(200).json(new ApiResponse(200, 'Optimal route found', optimalRoute));
});

export { getAutoComplete, getOptimalRouteForUser };
