import {
  emergencyRequest,
  emergencyResponse,
  requestStatusEnum,
  serviceProvider,
} from '@repo/db/schemas';

import { and, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { logger } from '@/config/logger/winston.config';
import db from '@/db';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { getOptimalRoute, reverseGeoCode } from '@/utils/maps/galli-maps';

// Helper function to generate a nearby location
const generateNearbyLocation = (baseLocation: {
  latitude: number;
  longitude: number;
}) => {
  const latOffset = (Math.random() - 0.5) * 0.03;
  const lngOffset = (Math.random() - 0.5) * 0.02;

  return {
    latitude: (baseLocation.latitude + latOffset).toString(),
    longitude: (baseLocation.longitude + lngOffset).toString(),
  };
};

const createEmergencyResponse = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser.id) {
      throw ApiError.badRequest('Please login to perform this action');
    }

    let { emergencyRequestId, destLocation } = req.body;

    if (!emergencyRequestId) {
      throw ApiError.badRequest('Emergency ID are required');
    }

    const existingEmergencyResponse =
      await db.query.emergencyResponse.findFirst({
        where: and(
          eq(emergencyRequestId, emergencyResponse.emergencyRequestId)
        ),
      });

    if (existingEmergencyResponse) {
      throw ApiError.badRequest('Emergency response already exists');
    }

    if (!destLocation) {
      destLocation = loggedInUser.currentLocation;
    }

    const emergencyRequestDetails = await db.query.emergencyRequest.findFirst({
      where: eq(emergencyRequest.id, emergencyRequestId),
    });

    if (
      isNaN(parseFloat(destLocation.latitude)) ||
      isNaN(parseFloat(destLocation.longitude))
    ) {
      throw ApiError.badRequest('Invalid emergency location coordinates');
    }

    const emergencyRequestType = emergencyRequestDetails?.serviceType;

    if (!emergencyRequestType) {
      throw ApiError.badRequest('Emergency request type not found');
    }

    // ! Simulating the nearby Location
    const simulatedProviderLocation = generateNearbyLocation(destLocation);

    const selectedServiceProvider = await db
      .update(serviceProvider)
      .set({
        currentLocation: simulatedProviderLocation,
      })
      .where(
        and(
          eq(serviceProvider.serviceStatus, 'available'),
          eq(serviceProvider.serviceType, emergencyRequestType)
        )
      )
      .returning();

    const serviceProviderId = selectedServiceProvider[0]!.id;

    const assignedServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, serviceProviderId),
    });

    if (!assignedServiceProvider || !emergencyRequestDetails) {
      throw ApiError.notFound(
        'Service provider or emergency request not found'
      );
    }

    if (!assignedServiceProvider.currentLocation) {
      throw ApiError.badRequest('Service provider location not found');
    }

    const optimalPath = await getOptimalRoute({
      srcLat: assignedServiceProvider.currentLocation?.latitude,
      srcLng: assignedServiceProvider.currentLocation?.longitude,
      dstLat: destLocation?.latitude.toString(),
      dstLng: destLocation?.longitude.toString(),
    });

    if (!optimalPath) {
      throw ApiError.badRequest('Error getting optimal path');
    }

    const newEmergencyResponse = await db
      .insert(emergencyResponse)
      .values({
        emergencyRequestId,
        serviceProviderId,
        assignedAt: new Date(emergencyRequestDetails.createdAt),
        originLocation: assignedServiceProvider.currentLocation,
        destinationLocation: {
          latitude: destLocation.latitude.toString(),
          longitude: destLocation.longitude.toString(),
        },
      })
      .returning();

    if (!newEmergencyResponse) {
      throw ApiError.internalServerError('Error creating emergency response');
    }

    const updatedStatus = Promise.all([
      db
        .update(emergencyRequest)
        .set({
          requestStatus: 'assigned',
        })
        .where(eq(emergencyRequest.id, emergencyRequestId)),

      db
        .update(serviceProvider)
        .set({
          serviceStatus: 'assigned',
        })
        .where(eq(serviceProvider.id, serviceProviderId)),
    ]);

    const locationName = await reverseGeoCode(
      emergencyRequestDetails.location.longitude,
      emergencyRequestDetails.location.latitude
    );

    if (!updatedStatus) {
      await db
        .delete(emergencyResponse)
        .where(eq(emergencyResponse.id, newEmergencyResponse[0]!.id));

      logger.debug(
        'Error updating emergency request and service provider status'
      );
      throw ApiError.internalServerError(
        'Error updating emergency request and service provider status'
      );
    }

    logger.debug('Optimal path', optimalPath);
    logger.debug('New emergency response', newEmergencyResponse);

    res.status(201).json(
      new ApiResponse(201, 'Emergency response created', {
        emergencyResponse: newEmergencyResponse,
        optimalPath,
      })
    );
  }
);

const getEmergencyResponse = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      logger.debug('Emergency response ID is required');
      throw ApiError.badRequest('Emergency response ID is required');
    }

    const existingEmergencyResponse =
      await db.query.emergencyResponse.findFirst({
        where: eq(emergencyResponse.id, id),
      });

    if (!existingEmergencyResponse) {
      logger.debug('Emergency response not found');
      throw ApiError.notFound('Emergency response not found');
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, 'Emergency response found', emergencyResponse)
      );
  }
);

const updateEmergencyResponse = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { statusUpdate, updateDescription } = req.body;

    logger.debug('🔄 Status Update:', { statusUpdate, updateDescription });

    if (!id) {
      logger.debug('Emergency response ID is required');
      throw ApiError.badRequest('Emergency response ID is required');
    }

    const existingEmergencyResponse =
      await db.query.emergencyResponse.findFirst({
        where: eq(emergencyResponse.id, id),
      });

    if (!existingEmergencyResponse) {
      logger.debug('Emergency response not found');
      throw ApiError.notFound('Emergency response not found');
    }

    const updatedEmergencyResponse = await db.transaction(async tx => {
      // Update emergency response
      const updatedResponse = await tx
        .update(emergencyResponse)
        .set({
          statusUpdate,
          updateDescription,
        })
        .where(eq(emergencyResponse.id, id))
        .returning({
          id: emergencyResponse.id,
          emergencyRequestId: emergencyResponse.emergencyRequestId,
          serviceProviderId: emergencyResponse.serviceProviderId,
          assignedAt: emergencyResponse.assignedAt,
          respondedAt: emergencyResponse.respondedAt,
          statusUpdate: emergencyResponse.statusUpdate,
          updateDescription: emergencyResponse.updateDescription,
        });

      if (!updatedResponse || updatedResponse.length === 0) {
        throw ApiError.internalServerError('Error updating emergency response');
      }

      let requestStatus: (typeof requestStatusEnum.enumValues)[number];
      switch (statusUpdate) {
        case 'arrived':
          requestStatus = 'in_progress';
          break;
        case 'rejected':
          requestStatus = 'pending'; // Set back to pending so it can be reassigned
          break;
        case 'completed':
          requestStatus = 'completed';
          break;
        default:
          requestStatus = 'assigned';
      }

      // Update emergency request status
      const updatedRequest = await tx
        .update(emergencyRequest)
        .set({
          requestStatus,
        })
        .where(
          eq(emergencyRequest.id, existingEmergencyResponse.emergencyRequestId!)
        )
        .returning();

      if (!updatedRequest || updatedRequest.length === 0) {
        throw ApiError.internalServerError('Error updating emergency request');
      }

      return updatedResponse[0];
    });

    if (!updatedEmergencyResponse) {
      logger.debug('Error updating emergency response');
      throw ApiError.internalServerError('Error updating emergency response');
    }

    // Get the emergency request to get the user ID
    const emergencyRequestDetails = await db.query.emergencyRequest.findFirst({
      where: eq(
        emergencyRequest.id,
        existingEmergencyResponse.emergencyRequestId!
      ),
    });

    if (!emergencyRequestDetails) {
      logger.debug('Emergency request not found');
      throw ApiError.notFound('Emergency request not found');
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          'Emergency response updated',
          updatedEmergencyResponse
        )
      );
  }
);

const deleteEmergencyResponse = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      logger.debug('Emergency response ID is required');
      throw ApiError.badRequest('Emergency response ID is required');
    }

    const existingEmergencyResponse =
      await db.query.emergencyResponse.findFirst({
        where: eq(emergencyResponse.id, id),
      });

    if (!existingEmergencyResponse) {
      logger.debug('Emergency response not found');
      throw ApiError.notFound('Emergency response not found');
    }

    const deletedEmergencyResponse = await db
      .delete(emergencyResponse)
      .where(eq(emergencyResponse.id, id))
      .returning({
        id: emergencyResponse.id,
        emergencyRequestId: emergencyResponse.emergencyRequestId,
        serviceProviderId: emergencyResponse.serviceProviderId,

        assignedAt: emergencyResponse.assignedAt,
        respondedAt: emergencyResponse.respondedAt,

        statusUpdate: emergencyResponse.statusUpdate,
        updateDescription: emergencyResponse.updateDescription,
      });

    if (!deletedEmergencyResponse) {
      logger.debug('Error deleting emergency response');
      throw ApiError.internalServerError('Error deleting emergency response');
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          'Emergency response deleted',
          deletedEmergencyResponse
        )
      );
  }
);

const getProviderResponses = asyncHandler(
  async (req: Request, res: Response) => {
    const loggedInUser = req.user;

    if (!loggedInUser || !loggedInUser.id) {
      logger.debug('Unauthorized');
      throw ApiError.unauthorized('Unauthorized');
    }

    const existingServiceProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInUser.id),
      columns: {
        id: true,
        name: true,
        phoneNumber: true,
        email: true,
        age: true,
        primaryAddress: true,
      },
    });

    if (!existingServiceProvider) {
      logger.debug('Unauthorized Service Provider');
      throw ApiError.unauthorized('Unauthorized Service Provider');
    }

    const providerResponses = await db.query.emergencyResponse.findMany({
      where: eq(
        emergencyResponse.serviceProviderId,
        existingServiceProvider.id
      ),
    });

    logger.debug('PROVIDER Responses', providerResponses);
    return res
      .status(200)
      .json(
        new ApiResponse(200, 'Provider responses found', providerResponses)
      );
  }
);

const emergencyResponseController = {
  createEmergencyResponse,
  getEmergencyResponse,
  updateEmergencyResponse,
  deleteEmergencyResponse,
  getProviderResponses,
} as const;

export default emergencyResponseController;

export {
  createEmergencyResponse,
  getEmergencyResponse,
  updateEmergencyResponse,
  deleteEmergencyResponse,
  getProviderResponses,
};
