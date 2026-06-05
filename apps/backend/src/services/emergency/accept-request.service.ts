import {
  emergencyRequest,
  emergencyResponse,
  requestEvents,
  serviceProvider,
  user,
} from '@repo/db/schemas';

import { and, eq } from 'drizzle-orm';

import { logger } from '@/config/logger/winston.config';
import { MUST_CONNECT_TIMEOUT_MS } from '@/constants';
import db from '@/db';
import { sendLocalSMS } from '@/services/local-sms.service';
import { getRouteFromMapbox } from '@/services/mapbox.service';
import {
  acquireLock,
  getEmergencyProviders,
  releaseLock,
} from '@/services/redis.service';
import type { RouteResult } from '@/types/maps.types';
import { SMS_TEMPLATES } from '@/workers/messaging.worker';

export interface AcceptRequestInput {
  requestId: string;
  providerId: string;
}

export interface ProviderInfo {
  id: string;
  name: string | null;
  phoneNumber: string | null;
  serviceType: string | null;
  vehicleInformation: { number?: string } | null;
  currentLocation: { latitude: string; longitude: string } | null;
}

export interface AcceptRequestSuccess {
  outcome: 'accepted';
  request: {
    id: string;
    userId: string;
    serviceType: string;
    description: string | null;
    location: { latitude: number; longitude: number } | null;
    source: string | null;
  };
  provider: ProviderInfo;
  route: RouteResult['route'] | null;
  providerIds: string[];
}

export interface AcceptRequestTaken {
  outcome: 'already_taken';
  message: string;
}

export interface AcceptRequestFailed {
  outcome: 'failed';
  message: string;
}

export type AcceptRequestResult =
  | AcceptRequestSuccess
  | AcceptRequestTaken
  | AcceptRequestFailed;

export async function acceptRequest(
  input: AcceptRequestInput
): Promise<AcceptRequestResult> {
  const { requestId, providerId } = input;

  const acquired = await acquireLock(requestId, providerId);
  if (!acquired) {
    return {
      outcome: 'already_taken',
      message: 'Another provider accepted this request',
    };
  }

  try {
    const mustConnectBy = new Date(Date.now() + MUST_CONNECT_TIMEOUT_MS);

    const result = await db
      .update(emergencyRequest)
      .set({
        requestStatus: 'accepted',
        mustConnectBy: mustConnectBy.toISOString(),
      })
      .where(
        and(
          eq(emergencyRequest.id, requestId),
          eq(emergencyRequest.requestStatus, 'pending')
        )
      )
      .returning({
        id: emergencyRequest.id,
        userId: emergencyRequest.userId,
        serviceType: emergencyRequest.serviceType,
        description: emergencyRequest.description,
        location: emergencyRequest.location,
        source: emergencyRequest.source,
      });

    if (result.length === 0) {
      await releaseLock(requestId);
      return {
        outcome: 'already_taken',
        message: 'Request was just accepted by another provider',
      };
    }

    const req = result[0];
    if (!req) {
      await releaseLock(requestId);
      return {
        outcome: 'failed',
        message: 'Request not found. Please try again.',
      };
    }

    // Log event
    await db.insert(requestEvents).values({
      requestId,
      eventType: 'accepted',
      providerId,
      metadata: { acceptedAt: new Date().toISOString() },
    });

    // Create emergency response
    const providerData = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, providerId),
    });

    await db.insert(emergencyResponse).values({
      emergencyRequestId: requestId,
      serviceProviderId: providerId,
      originLocation: {
        latitude: providerData?.currentLocation?.latitude ?? '0',
        longitude: providerData?.currentLocation?.longitude ?? '0',
      },
      destinationLocation: {
        latitude: req.location?.latitude.toString() || '0',
        longitude: req.location?.longitude.toString() || '0',
      },
      assignedAt: new Date(),
    });

    // Get provider info and route
    const providerInfo = await db
      .select({
        id: serviceProvider.id,
        name: serviceProvider.name,
        phoneNumber: serviceProvider.phoneNumber,
        serviceType: serviceProvider.serviceType,
        vehicleInformation: serviceProvider.vehicleInformation,
        currentLocation: serviceProvider.currentLocation,
      })
      .from(serviceProvider)
      .where(eq(serviceProvider.id, providerId))
      .limit(1);

    const provider = providerInfo[0] as ProviderInfo | undefined;

    // Calculate route
    let routeData: RouteResult['route'] | null = null;
    if (provider?.currentLocation && req.location) {
      const providerLoc = provider.currentLocation;
      const userLoc = req.location;
      if (providerLoc.latitude && providerLoc.longitude) {
        const routeResult = await getRouteFromMapbox(
          {
            lat: parseFloat(providerLoc.latitude),
            lng: parseFloat(providerLoc.longitude),
          },
          { lat: userLoc.latitude, lng: userLoc.longitude }
        );
        if (routeResult.success && routeResult.route) {
          routeData = routeResult.route;
        }
      }
    }

    // SMS notification for SMS-sourced requests
    const source = req.source || 'app';
    if (source === 'sms') {
      const userInfo = await db.query.user.findFirst({
        where: eq(user.id, req.userId),
      });
      if (userInfo?.phoneNumber) {
        const emergencyTypeLabel =
          req.serviceType === 'ambulance'
            ? 'Medical/Ambulance'
            : req.serviceType === 'fire_truck'
              ? 'Fire'
              : req.serviceType === 'rescue_team'
                ? 'Rescue'
                : 'Police';
        await sendLocalSMS(
          userInfo.phoneNumber.toString(),
          SMS_TEMPLATES.PROVIDER_ASSIGNED(
            emergencyTypeLabel,
            providerData?.name || 'Responder'
          )
        );
      }
    }

    const providerIds = await getEmergencyProviders(requestId);

    // Schedule lock release
    setTimeout(async () => {
      await releaseLock(requestId);
    }, 2000);

    return {
      outcome: 'accepted',
      request: {
        id: req.id,
        userId: req.userId,
        serviceType: req.serviceType,
        description: req.description,
        location: req.location,
        source: req.source,
      },
      provider: provider ?? {
        id: providerId,
        name: null,
        phoneNumber: null,
        serviceType: null,
        vehicleInformation: null,
        currentLocation: null,
      },
      route: routeData,
      providerIds,
    };
  } catch (error) {
    await releaseLock(requestId).catch(() => {});
    logger.error(`Error in acceptRequest: ${error}`);
    return {
      outcome: 'failed',
      message: 'Failed to accept request. Please try again.',
    };
  }
}
