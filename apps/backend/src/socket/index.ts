import { getSectorConfig } from '@repo/config';
import { organization, serviceProvider } from '@repo/db/schemas';

import { createServer } from 'node:http';

import { HttpStatusCode } from 'axios';
import { parse } from 'cookie';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';
import { Server, Socket } from 'socket.io';

import { envConfig } from '@/config';
import { OtherRoles, UserRoles } from '@/constants';
import {
  SocketEvents,
  SocketRoom,
  type SocketRoomType,
} from '@/constants/socket.constants';
import db from '@/db';
import { verifyMfaTokenHeader } from '@/services/mfa.service';
import ApiError from '@/utils/api/ApiError';
import { verifyAndDecodeToken } from '@/utils/tokens/jwtTokens';

import { registerEmergencyHandlers } from './emergency.handlers';
import { setupLocationHandlers } from './location.handler';

let io: Server | null = null;

async function authenticateUser(socket: Socket, next: (err?: Error) => void) {
  const cookies = parse(socket.handshake?.headers?.cookie || '');
  let token = cookies?.accessToken;

  if (!token) {
    token = socket.handshake?.auth?.token || '';
  }

  if (!token) {
    throw ApiError.unauthorized('Token not found for user');
  }

  const decoded = await verifyAndDecodeToken(token);
  if (!decoded) {
    return next(new ApiError(HttpStatusCode.Unauthorized, 'Invalid token'));
  }

  // Enforce hard platform vs silo boundaries at socket layer.
  if (envConfig.mode === 'platform') {
    if (decoded.role !== UserRoles.USER && decoded.role !== UserRoles.ADMIN) {
      return next(new ApiError(HttpStatusCode.Forbidden, 'Invalid role'));
    }
  } else {
    if (
      decoded.role !== OtherRoles.SERVICE_PROVIDER &&
      decoded.role !== OtherRoles.ORGANIZATION
    ) {
      return next(new ApiError(HttpStatusCode.Forbidden, 'Invalid role'));
    }
  }

  // Block socket usage when org lifecycle status is not active.
  // Restricted tokens are also blocked.
  if (decoded.restricted) {
    return next(
      new ApiError(HttpStatusCode.Forbidden, 'Organization access restricted')
    );
  }
  if (decoded.role === OtherRoles.ORGANIZATION) {
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, decoded.id),
      columns: { lifecycleStatus: true },
    });
    if (!org || org.lifecycleStatus !== 'active') {
      return next(
        new ApiError(HttpStatusCode.Forbidden, 'Organization access restricted')
      );
    }
  }
  if (decoded.role === OtherRoles.SERVICE_PROVIDER) {
    const prov = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, decoded.id),
      columns: { organizationId: true },
    });
    if (!prov?.organizationId) {
      return next(
        new ApiError(HttpStatusCode.Forbidden, 'Organization access restricted')
      );
    }
    const org = await db.query.organization.findFirst({
      where: eq(organization.id, prov.organizationId),
      columns: { lifecycleStatus: true },
    });
    if (!org || org.lifecycleStatus !== 'active') {
      return next(
        new ApiError(HttpStatusCode.Forbidden, 'Organization access restricted')
      );
    }
  }

  // Compliance constraints are sector-bound and apply only to silo runtime.
  // Platform runtime should not depend on SECTOR.
  const cfg = envConfig.mode === 'silo' ? getSectorConfig() : null;
  if (envConfig.mode === 'silo' && cfg) {
    if (typeof decoded.iat === 'number') {
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (nowSeconds - decoded.iat > cfg.compliance.sessionTimeoutSeconds) {
        return next(
          new ApiError(HttpStatusCode.Unauthorized, 'Session expired')
        );
      }
    }

    if (cfg.compliance.mfaRequired) {
      const mfaToken =
        (socket.handshake?.auth?.mfaToken as string | undefined) ||
        ((socket.handshake?.headers as any)?.['x-mfa-token'] as
          | string
          | undefined) ||
        '';
      const ok = await verifyMfaTokenHeader({
        userId: decoded.id,
        token: mfaToken,
      });
      if (!ok) {
        return next(new ApiError(HttpStatusCode.Forbidden, 'MFA required'));
      }
    }
  }

  socket.user = decoded;
  next();
}

function initializeSocketServer(
  httpServer: ReturnType<typeof createServer>
): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
    },
  });

  io.use(authenticateUser);
  io.on(SocketEvents.CONNECTION, (socket: Socket) => {
    console.log(
      'User connected to socket',
      socket.id,
      '| User ID:',
      socket.user.id,
      '| Role:',
      socket.user.role
    );

    socket.join(socket.user.id);

    // Join role-specific rooms based on MODE.
    if (envConfig.mode === 'platform') {
      socket.join(SocketRoom.USER(socket.user.id));
      console.log('Joined USER room:', SocketRoom.USER(socket.user.id));
    } else if (socket.user.role === OtherRoles.ORGANIZATION) {
      socket.join(SocketRoom.ORGANIZATION(socket.user.id));
      console.log(
        'Joined ORGANIZATION room:',
        SocketRoom.ORGANIZATION(socket.user.id)
      );
    } else if (socket.user.role === OtherRoles.SERVICE_PROVIDER) {
      socket.join(SocketRoom.PROVIDER(socket.user.id));
      console.log('Joined PROVIDER room:', SocketRoom.PROVIDER(socket.user.id));
      const room = io!.sockets.adapter.rooms.get(
        SocketRoom.PROVIDER(socket.user.id)
      );
      console.log('Provider room members:', room ? [...room] : 'none');
    }

    // Register handlers based on MODE.
    // Platform: user-side events only.
    // Silo: provider-side events only.
    if (envConfig.mode === 'platform') {
      // Platform only needs user-side events
      registerEmergencyHandlers(io!, socket, socket.user.role);
    } else {
      // Silo only needs provider/org-side events
      registerEmergencyHandlers(io!, socket, socket.user.role);
    }
    setupLocationHandlers(io!, socket);

    socket.on(SocketEvents.DISCONNECT, () => {
      console.log('User disconnected from socket', socket.id);
    });
  });

  return io;
}

function getIo(): Server | null {
  return io;
}

function emitSocketEvent<T>(
  req: Request,
  socketEvent: SocketEvents,
  roomId: SocketRoomType,
  payload: T
) {
  req.app.get('io').in(roomId).emit(socketEvent, payload);
}

export { initializeSocketServer, getIo, emitSocketEvent };
