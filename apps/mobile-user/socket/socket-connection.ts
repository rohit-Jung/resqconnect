import { socketManager } from './socket-manager';

export function connectToSocketServer({ token }: { token: string | null }) {
  socketManager.connect(token);
}

export function disconnectSocket() {
  socketManager.disconnect();
}
