import { createServer } from 'node:http';

import { HttpStatusCode } from 'axios';
import { parse } from 'cookie';
import type { Request } from 'express';
import { Server, Socket } from 'socket.io';

import { OtherRoles, UserRoles } from '@/constants';
import {
  SocketEvents,
  SocketRoom,
  type SocketRoomType,
} from '@/constants/socket.constants';
import ApiError from '@/utils/api/ApiError';
import { verifyAndDecodeToken } from '@/utils/tokens/jwtTokens';

import { registerEmergencyHandlers } from './emergency.handlers';

let io: Server | null = null;

async function authenticateUser(socket: Socket, next: (err?: Error) => void) {
  const cookies = parse(socket.handshake?.headers?.cookie || '');
  let token = cookies?.accessToken;

  if (!token) {
    token = socket.handshake?.auth?.token || '';
  }

  if (!token) {
    throw new ApiError(HttpStatusCode.Unauthorized, 'Token not found for user');
  }

  const decoded = await verifyAndDecodeToken(token);
  if (!decoded) {
    return next(new ApiError(HttpStatusCode.Unauthorized, 'Invalid token'));
  }

  socket.user = decoded;
  next();
}

function initializeSocketServer(
  httpServer: ReturnType<typeof createServer>,
): Server {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
    },
  });

  io.use(authenticateUser);
  io.on(SocketEvents.CONNECTION, (socket: Socket) => {
    console.log('User connected to socket', socket.id);

    socket.join(socket.user.id);

    // Join users to their respective rooms
    if (
      socket.user.role == UserRoles.ADMIN ||
      socket.user.role === UserRoles.USER
    ) {
      socket.join(SocketRoom.USER(socket.user.id));
    } else if (socket.user.role === OtherRoles.ORGANIZATION) {
      socket.join(SocketRoom.ORGANIZATION(socket.user.id));
    } else if (socket.user.role === OtherRoles.SERVICE_PROVIDER) {
      socket.join(SocketRoom.PROVIDER(socket.user.id));
    }

    // Register emergency-related handlers
    registerEmergencyHandlers(io!, socket);

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
  payload: T,
) {
  req.app.get('io').in(roomId).emit(socketEvent, payload);
}

export { initializeSocketServer, getIo, emitSocketEvent };
