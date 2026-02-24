import { Socket, io } from 'socket.io-client';

import { SocketEvents } from '@/constants/socket.constants';
import { useSocketStore } from '@/store/socketStore';

type EventHandler = (data: any) => void;

const DEBUG_SOCKET = true;

class SocketManager {
  private socket: Socket | null = null;

  // different comps can handle single socket event differently
  private eventHandlers: Map<SocketEvents, Set<EventHandler>> = new Map();
  private isInitialized = false;

  connect(token: string | null) {
    if (this.isInitialized && this.socket?.connected) {
      console.warn('Socket already initialized and connected');
      return this.socket;
    }

    // If socket exists but disconnected, clean up first
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const SOCKET_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
    const { setSocket, setIsConnected, setSocketId } =
      useSocketStore.getState();

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.isInitialized = true;

    if (DEBUG_SOCKET) {
      this.socket.onAny((event, ...args) => {
        console.log(
          `%c⬇️ SOCKET EVENT`,
          'color:#4CAF50;font-weight:bold;',
          event,
          args.length === 1 ? args[0] : args
        );
      });

      // Wrap emit to log outgoing events
      const originalEmit = this.socket.emit.bind(this.socket);
      this.socket.emit = ((event: string, ...args: any[]) => {
        console.log(
          `%c⬆️ SOCKET EMIT`,
          'color:#2196F3;font-weight:bold;',
          event,
          args.length === 1 ? args[0] : args
        );
        return originalEmit(event, ...args);
      }) as any;
    }

    /** connect 
     application-level connection (authenticated, ready to send/receive events)

     Open 
     Underlying transport (WebSocket) is established (raw connection, no auth yet)
     **/
    this.socket.on('connect', () => {
      console.log('Socket Connected:', this.socket?.id);
      setSocket(this.socket);
      setIsConnected(true);
      setSocketId(this.socket?.id || null);
      this.reattachHandlers();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket Disconnected');
      setIsConnected(false);
      setSocketId(null);
    });

    this.socket.io.on('open', () => {
      console.log('Socket Open');
      console.log('TOKEN', token);
    });

    this.socket.io.on('close', () => {
      console.log('Socket Closed');
    });

    return this.socket;
  }

  on(event: SocketEvents, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    this.eventHandlers.get(event)!.add(handler);

    // Always attach to socket if it exists (Socket.IO handles queueing if not connected)
    if (this.socket) {
      this.socket.on(event, handler);
      console.log(
        `Subscribed to ${event} (socket ${this.socket.connected ? 'connected' : 'connecting'})`
      );
    } else {
      console.log(`Queued subscription to ${event} (no socket yet)`);
    }
  }

  off(event: SocketEvents, handler: EventHandler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }

      if (this.socket) {
        this.socket.off(event, handler);
      }

      console.log(`Unsubscribed from event ${event}`);
    }
  }

  emit(event: SocketEvents, data?: any) {
    if (!this.socket) {
      return;
    }

    this.socket.emit(event, data);
  }

  private reattachHandlers() {
    if (!this.socket) return;

    console.log('Re-attaching event handlers after reconnection');

    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach(handler => {
        this.socket!.on(event, handler);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isInitialized = false;
      this.eventHandlers.clear();
    }
  }

  getSocket() {
    return this.socket;
  }

  isConnected() {
    return this.socket?.connected || false;
  }
}

export const socketManager = new SocketManager();
