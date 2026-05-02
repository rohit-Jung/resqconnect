import {
  emergencyRequest,
  emergencyResponse,
  requestEvents,
  serviceProvider,
} from '@repo/db/schemas';
import { EmergencyRequestPayload } from '@repo/types/validations';

import { eq } from 'drizzle-orm';
import type { Request, Response } from 'express';

import { envConfig } from '@/config';
import { SocketEvents, SocketRoom } from '@/constants/socket.constants';
import db from '@/db';
import { getIo } from '@/socket';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';

type SiloIncomingAck = {
  ok: true;
  silo: string;
  platformIncidentId: string;
};

// PLATFORM: receives updates from silos and forwards to user sockets.
const platformIncidentUpdate = asyncHandler(
  async (req: Request, res: Response) => {
    if (envConfig.mode !== 'platform') {
      throw ApiError.notFound('Not found');
    }

    const platformIncidentId = String(req.params.platformIncidentId || '');
    if (!platformIncidentId) {
      throw ApiError.badRequest('platformIncidentId is required');
    }

    const {
      userId,
      eventType,
      requestStatus,
      provider,
      route,
      message,
      payload,
    } = (req.body ?? {}) as Record<string, any>;

    if (typeof userId !== 'string' || userId.length === 0) {
      throw ApiError.badRequest('userId is required');
    }
    if (typeof eventType !== 'string' || eventType.length === 0) {
      throw ApiError.badRequest('eventType is required');
    }

    // best-effort: keep platform db status in sync if requested.
    if (typeof requestStatus === 'string' && requestStatus.length > 0) {
      await db
        .update(emergencyRequest)
        .set({ requestStatus: requestStatus as any })
        .where(eq(emergencyRequest.id, platformIncidentId));
    }

    const io = getIo();
    if (io) {
      const room = SocketRoom.USER(userId);

      switch (eventType) {
        case SocketEvents.REQUEST_ACCEPTED:
          io.to(room).emit(SocketEvents.REQUEST_ACCEPTED, {
            requestId: platformIncidentId,
            provider,
            route,
            message,
          });
          break;
        case SocketEvents.JOINED_EMERGENCY_ROOM:
          io.to(room).emit(SocketEvents.JOINED_EMERGENCY_ROOM, {
            requestId: platformIncidentId,
            emergencyLocation: payload?.emergencyLocation,
            emergencyType: payload?.emergencyType,
            providerId: payload?.providerId,
            userId,
          });
          break;
        case SocketEvents.PROVIDER_LOCATION_UPDATED:
        case SocketEvents.USER_LOCATION_UPDATED:
        case SocketEvents.REQUEST_COMPLETED:
        case SocketEvents.REQUEST_CANCELLED:
        case SocketEvents.REQUEST_CANCELLED_NOTIFICATION:
        case SocketEvents.PROVIDER_CONFIRM_ARRIVAL:
        case SocketEvents.PROVIDER_ARRIVAL_CONFIRMED:
          io.to(room).emit(eventType as any, {
            requestId: platformIncidentId,
            ...(payload ?? {}),
          });
          break;
        default:
          // ignore unknown events
          break;
      }
    }

    return res.status(200).json(new ApiResponse(200, 'ok', { ok: true }));
  }
);

// SILO: platform dispatches incoming incidents here.
const siloIncomingIncident = asyncHandler(
  async (req: Request, res: Response) => {
    if (envConfig.mode !== 'silo') {
      throw ApiError.notFound('Not found');
    }

    const parsed = EmergencyRequestPayload.safeParse(req.body);
    if (!parsed.success) {
      throw ApiError.badRequest('Invalid incident payload');
    }

    const data = parsed.data;

    // ACK fast: ensure the request row exists in this silo DB.
    // important: userid is platform-owned; there is intentionally no fk to local user table.
    await db
      .insert(emergencyRequest)
      .values({
        id: data.requestId as any,
        userId: data.userId as any,
        serviceType: data.emergencyType as any,
        description: data.emergencyDescription,
        location: data.emergencyLocation,
        requestStatus: 'pending',
        searchRadius: 1,
        expiresAt: data.expiresAt ?? null,
        // geolocation/h3index are not required for matching.service (it uses provider.lastlocation)
        h3Index: null,
        geoLocation: null,
      } as any)
      // if it already exists, do nothing
      .onConflictDoNothing();

    await db.insert(requestEvents).values({
      requestId: data.requestId as any,
      eventType: 'platform_dispatch_received',
      metadata: { source: 'platform', receivedAt: new Date().toISOString() },
    });

    const ack: SiloIncomingAck = {
      ok: true,
      silo: String(envConfig.silo_name ?? process.env.SECTOR ?? 'unknown'),
      platformIncidentId: data.requestId,
    };

    return res.status(200).json(new ApiResponse(200, 'ACK', ack));
  }
);

export default {
  platformIncidentUpdate,
  siloIncomingIncident,
} as const;
