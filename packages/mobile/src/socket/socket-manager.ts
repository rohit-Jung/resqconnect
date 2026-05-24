import { Socket, io } from 'socket.io-client';

type EventHandler = (data: any) => void;

export interface SocketManagerCallbacks {
  onConnect?: (socket: Socket) => void;
  onDisconnect?: () => void;
}

export interface ISocketManager {
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
  emit(event: string, data?: any): void;
  emitWithAck(
    event: string,
    data?: any,
    callback?: (error?: Error | null) => void
  ): Promise<void>;
}

export class SocketManager implements ISocketManager {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private isInitialized = false;

  constructor(private callbacks: SocketManagerCallbacks = {}) {}

  connect(url: string, token: string | null, debug = false) {
    if (this.isInitialized && this.socket?.connected) {
      console.warn('Socket already initialized and connected');
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.socket = io(url, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    this.isInitialized = true;

    if (debug) {
      this.socket.onAny((event, ...args) => {
        console.log(
          `[🏴‍☠️ ANY] SOCKET EVENT`,
          event,
          args.length === 1 ? args[0] : args
        );
      });

      const originalEmit = this.socket.emit.bind(this.socket);
      this.socket.emit = ((event: string, ...args: any[]) => {
        console.log(
          `[⬆️ EMIT] SOCKET EMIT`,
          event,
          args.length === 1 ? args[0] : args
        );
        return originalEmit(event, ...args);
      }) as any;
    }

    this.socket.on('connect', () => {
      console.log('Socket Connected:', this.socket?.id);
      this.callbacks.onConnect?.(this.socket!);
      this.reattachHandlers();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket Disconnected');
      this.callbacks.onDisconnect?.();
    });

    this.socket.io.on('open', () => console.log('Socket Open'));
    this.socket.io.on('close', () => console.log('Socket Closed'));

    return this.socket;
  }

  on(event: string, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    if (this.socket) {
      this.socket.on(event, handler);
    } else {
      console.log(`Queued subscription to ${event} (no socket yet)`);
    }
  }

  off(event: string, handler: EventHandler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) this.eventHandlers.delete(event);
      this.socket?.off(event, handler);
    }
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }

  emitWithAck(
    event: string,
    data?: any,
    callback?: (error?: Error | null) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        const error = new Error('Socket not initialized');
        callback?.(error);
        reject(error);
        return;
      }

      this.socket.emit(event, data, (response: any) => {
        if (response?.error) {
          const error = new Error(response.error);
          callback?.(error);
          reject(error);
        } else {
          callback?.(null);
          resolve();
        }
      });
    });
  }

  private reattachHandlers() {
    if (!this.socket) return;
    console.log('Re-attaching event handlers after reconnection');
    this.eventHandlers.forEach((handlers, event) => {
      handlers.forEach(handler => this.socket!.on(event, handler));
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
    return this.socket?.connected ?? false;
  }
}
