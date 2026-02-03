import { io, Socket } from 'socket.io-client';
import { useSocketStore } from '@/store/socketStore';

// TODO: provider has to listen to the new emergency
export function listenToNewEmergency(socket: Socket) {}

// TODO: emit the decision
export function emitDecision(socket: Socket) {}

// TODO: listen joined room for emergency-room:`id`
export function locationUpdates(socket: Socket) {}

export function connectToSocketServer({ token }: { token: string | null }) {
  const SOCKET_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
  const { setSocket, setIsConnected, setSocketId } = useSocketStore.getState();

  const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('Socket Connected:', socket.id);
    setSocket(socket);
    setIsConnected(true);
    setSocketId(socket.id || null);
  });

  socket.on('disconnect', () => {
    console.log('Socket Disconnected');
    setIsConnected(false);
    setSocketId(null);
  });

  socket.io.on('open', () => {
    console.log('Socket Open');
    console.log('TOKEN', token);
  });
  socket.io.on('close', () => {
    console.log('Socket Closed');
  });

  return socket;
}

export function disconnectSocket() {
  const { socket, setSocket, setIsConnected, setSocketId } = useSocketStore.getState();
  if (socket) {
    socket.disconnect();
    setSocket(null);
    setIsConnected(false);
    setSocketId(null);
  }
}
