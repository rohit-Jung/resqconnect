import { socketManager } from './socket-manager';

export function connectToSocketServer({ token }: { token: string | null }) {
  const url = process.env.EXPO_PUBLIC_BACKEND_URL ?? '';
  socketManager.connect(url, token, true);
}

export function disconnectSocket() {
  socketManager.disconnect();
}
