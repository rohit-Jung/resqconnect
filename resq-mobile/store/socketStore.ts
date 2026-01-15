import { create } from 'zustand';
import { Socket } from 'socket.io-client';

interface ISocketStore {
  socket: Socket | null;
  isConnected: boolean;
  socketId: string | null;
  setSocket: (socket: Socket | null) => void;
  setIsConnected: (connected: boolean) => void;
  setSocketId: (id: string | null) => void;
}

export const useSocketStore = create<ISocketStore>((set) => ({
  socket: null,
  isConnected: false,
  socketId: null,
  setSocket: (socket) => set({ socket }),
  setIsConnected: (isConnected) => set({ isConnected }),
  setSocketId: (socketId) => set({ socketId }),
}));
