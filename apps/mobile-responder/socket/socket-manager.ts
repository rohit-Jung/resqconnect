import { SocketManager } from '@repo/mobile/socket';

import { useSocketStore } from '@/store/socketStore';

export const socketManager = new SocketManager({
  onConnect: socket => {
    const { setSocket, setIsConnected, setSocketId } =
      useSocketStore.getState();
    setSocket(socket);
    setIsConnected(true);
    setSocketId(socket.id ?? null);
  },
  onDisconnect: () => {
    const { setIsConnected, setSocketId } = useSocketStore.getState();
    setIsConnected(false);
    setSocketId(null);
  },
});
