import { and, eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

// import { SocketEventEnums, SocketRoom } from '@/constants';
import db from '@/db';
import { emergencyRequest, emergencyResponse, requestStatusEnum, serviceProvider } from '@/models';
// import { emitSocketEvent } from '@/socket';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { getOptimalRoute, reverseGeoCode } from '@/utils/maps/galli-maps';

// import { createNotification } from './notification.controller';

// Helper function to generate a nearby location
const generateNearbyLocation = (baseLocation: { latitude: number; longitude: number }) => {
  const latOffset = (Math.random() - 0.5) * 0.03;
  const lngOffset = (Math.random() - 0.5) * 0.02;

  return {
    latitude: (baseLocation.latitude + latOffset).toString(),
    longitude: (baseLocation.longitude + lngOffset).toString(),
  };
};

const createEmergencyResponse = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    throw new ApiError(400, 'Please login to perform this action');
  }

  let { emergencyRequestId, destLocation } = req.body;

  if (!emergencyRequestId) {
    throw new ApiError(400, 'Emergency ID are required');
  }

  const existingEmergencyResponse = await db.query.emergencyResponse.findFirst({
    where: and(eq(emergencyRequestId, emergencyResponse.emergencyRequestId)),
  });

  if (existingEmergencyResponse) {
    throw new ApiError(400, 'Emergency response already exists');
  }

  if (!destLocation) {
    destLocation = loggedInUser.currentLocation;
  }

  const emergencyRequestDetails = await db.query.emergencyRequest.findFirst({
    where: eq(emergencyRequest.id, emergencyRequestId),
  });

  if (isNaN(parseFloat(destLocation.latitude)) || isNaN(parseFloat(destLocation.longitude))) {
    throw new ApiError(400, 'Invalid emergency location coordinates');
  }

  const emergencyRequestType = emergencyRequestDetails?.serviceType;

  if (!emergencyRequestType) {
    throw new ApiError(400, 'Emergency request type not found');
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

  // console.log(selectedServiceProvider, "selected provider");
  // const bestServiceProvider = await getBestServiceProvider(
  //   emergencyRequestLocation,
  //   emergencyRequestType
  // );

  // if (!bestServiceProvider || !bestServiceProvider.id) {
  //   await db
  //     .delete(emergencyRequest)
  //     .where(eq(emergencyRequest.id, emergencyRequestId));
  //   throw new ApiError(404, "No available service provider found");
  // }

  // const serviceProviderId = bestServiceProvider.id;

  // if(selectedServiceProvider.length === 0) {
  //   await db
  //     .delete(emergencyRequest)
  //     .where(eq(emergencyRequest.id, emergencyRequestId));
  //   throw new ApiError(404, "No available service provider found");
  // }

  const serviceProviderId = selectedServiceProvider[0]!.id;

  const assignedServiceProvider = await db.query.serviceProvider.findFirst({
    where: eq(serviceProvider.id, serviceProviderId),
  });

  if (!assignedServiceProvider || !emergencyRequestDetails) {
    throw new ApiError(404, 'Service provider or emergency request not found');
  }

  if (!assignedServiceProvider.currentLocation) {
    throw new ApiError(400, 'Service provider location not found');
  }

  const optimalPath = await getOptimalRoute({
    srcLat: assignedServiceProvider.currentLocation?.latitude,
    srcLng: assignedServiceProvider.currentLocation?.longitude,
    dstLat: destLocation?.latitude.toString(),
    dstLng: destLocation?.longitude.toString(),
  });

  if (!optimalPath) {
    throw new ApiError(400, 'Error getting optimal path');
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
    throw new ApiError(500, 'Error creating emergency response');
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

  // const providerNotification = await createNotification({

  //   serviceProviderId: assignedServiceProvider.id,
  //   userId: loggedInUser.id,
  //   message: `New emergency request assigned to you. Type: ${emergencyRequestType}`,
  //   type: 'emergency',
  //   priority: 'high',
  //   deliveryStatus: 'unread',
  //   source: 'system',
  //   metadata: {
  //     emergencyType: emergencyRequestType,
  //     location: locationName,
  //     distance: optimalPath?.distance || 'Calculating...',
  //     userInfo: {
  //       name: loggedInUser.name,
  //       contact: loggedInUser.phoneNumber,
  //     },
  //   },
  // });

  // emitSocketEvent(
  //   req,
  //   SocketRoom.PROVIDER(assignedServiceProvider.id),
  //   SocketEventEnums.PROVIDER_STATUS_UPDATED,
  //   {
  //     status: assignedServiceProvider.serviceStatus,
  //   }
  // );

  // Create notification for the user
  // emitSocketEvent(
  //   req,
  //   SocketRoom.PROVIDER(assignedServiceProvider.id),
  //   SocketEventEnums.NOTIFICATION_CREATED,
  //   providerNotification
  // );
  //
  // emitSocketEvent(
  //   req,
  //   SocketRoom.USER(loggedInUser.id),
  //   SocketEventEnums.EMERGENCY_RESPONSE_CREATED,
  //   {
  //     emergencyResponse: newEmergencyResponse[0],
  //     optimalPath,
  //   }
  // );
  //
  // emitSocketEvent(
  //   req,
  //   SocketRoom.PROVIDER(assignedServiceProvider.id),
  //   SocketEventEnums.EMERGENCY_RESPONSE_CREATED,
  //   {
  //     emergencyResponse: newEmergencyResponse[0],
  //     optimalPath,
  //   }
  // );

  if (!updatedStatus) {
    await db.delete(emergencyResponse).where(eq(emergencyResponse.id, newEmergencyResponse[0]!.id));

    console.log('Error updating emergency request and service provider status');
    throw new ApiError(500, 'Error updating emergency request and service provider status');
  }

  console.log('Optimal path', optimalPath);
  console.log('New emergency response', newEmergencyResponse);

  res.status(201).json(
    new ApiResponse(201, 'Emergency response created', {
      emergencyResponse: newEmergencyResponse,
      optimalPath,
    })
  );
});

const getEmergencyResponse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    console.log('Emergency response ID is required');
    throw new ApiError(400, 'Emergency response ID is required');
  }

  const existingEmergencyResponse = await db.query.emergencyResponse.findFirst({
    where: eq(emergencyResponse.id, id),
  });

  if (!existingEmergencyResponse) {
    console.log('Emergency response not found');
    throw new ApiError(404, 'Emergency response not found');
  }

  res.status(200).json(new ApiResponse(200, 'Emergency response found', emergencyResponse));
});

const updateEmergencyResponse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { statusUpdate, updateDescription } = req.body;

  console.log('🔄 Status Update:', { statusUpdate, updateDescription });

  if (!id) {
    console.log('Emergency response ID is required');
    throw new ApiError(400, 'Emergency response ID is required');
  }

  const existingEmergencyResponse = await db.query.emergencyResponse.findFirst({
    where: eq(emergencyResponse.id, id),
  });

  if (!existingEmergencyResponse) {
    console.log('Emergency response not found');
    throw new ApiError(404, 'Emergency response not found');
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
      throw new ApiError(500, 'Error updating emergency response');
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
      .where(eq(emergencyRequest.id, existingEmergencyResponse.emergencyRequestId!))
      .returning();

    if (!updatedRequest || updatedRequest.length === 0) {
      throw new ApiError(500, 'Error updating emergency request');
    }

    return updatedResponse[0];
  });

  if (!updatedEmergencyResponse) {
    console.log('Error updating emergency response');
    throw new ApiError(500, 'Error updating emergency response');
  }

  // Get the emergency request to get the user ID
  const emergencyRequestDetails = await db.query.emergencyRequest.findFirst({
    where: eq(emergencyRequest.id, existingEmergencyResponse.emergencyRequestId!),
  });

  if (!emergencyRequestDetails) {
    console.log('Emergency request not found');
    throw new ApiError(404, 'Emergency request not found');
  }

  // Emit socket events to both user and provider
  // emitSocketEvent(
  //   req,
  //   SocketRoom.PROVIDER(existingEmergencyResponse.serviceProviderId!),
  //   SocketEventEnums.EMERGENCY_RESPONSE_STATUS_UPDATED,
  //   {
  //     statusUpdate,
  //     message:
  //       statusUpdate === 'arrived'
  //         ? 'You have marked yourself as arrived'
  //         : 'You have rejected the emergency response',
  //   }
  // );
  //
  // emitSocketEvent(
  //   req,
  //   SocketRoom.USER(emergencyRequestDetails.userId),
  //   SocketEventEnums.EMERGENCY_RESPONSE_STATUS_UPDATED,
  //   {
  //     statusUpdate,
  //     message:
  //       statusUpdate === 'arrived'
  //         ? 'Service provider has arrived at your location'
  //         : 'Service provider has rejected the emergency response',
  //   }
  // );

  res
    .status(200)
    .json(new ApiResponse(200, 'Emergency response updated', updatedEmergencyResponse));
});

const deleteEmergencyResponse = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    console.log('Emergency response ID is required');
    throw new ApiError(400, 'Emergency response ID is required');
  }

  const existingEmergencyResponse = await db.query.emergencyResponse.findFirst({
    where: eq(emergencyResponse.id, id),
  });

  if (!existingEmergencyResponse) {
    console.log('Emergency response not found');
    throw new ApiError(404, 'Emergency response not found');
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
    console.log('Error deleting emergency response');
    throw new ApiError(500, 'Error deleting emergency response');
  }

  res
    .status(200)
    .json(new ApiResponse(200, 'Emergency response deleted', deletedEmergencyResponse));
});

const getProviderResponses = asyncHandler(async (req: Request, res: Response) => {
  const loggedInUser = req.user;

  if (!loggedInUser || !loggedInUser.id) {
    console.log('Unauthorized');
    throw new ApiError(401, 'Unauthorized');
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
    console.log('Unauthorized Service Provider');
    throw new ApiError(401, 'Unauthorized Service Provider');
  }

  const providerResponses = await db.query.emergencyResponse.findMany({
    where: eq(emergencyResponse.serviceProviderId, existingServiceProvider.id),
  });

  console.log('PROVIDER Responses', providerResponses);
  return res.status(200).json(new ApiResponse(200, 'Provider responses found', providerResponses));
});
export {
  createEmergencyResponse,
  getEmergencyResponse,
  updateEmergencyResponse,
  deleteEmergencyResponse,
  getProviderResponses,
};
