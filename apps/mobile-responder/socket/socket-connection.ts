import { useProviderStore } from '@/store/providerStore';

import { socketManager } from './socket-manager';

export function connectToSocketServer({ token }: { token: string | null }) {
  const siloBaseUrl = useProviderStore.getState().siloBaseUrl;
  const fallback = process.env.EXPO_PUBLIC_BACKEND_URL;
  let url = (siloBaseUrl || fallback || '').replace(/\/$/, '');
  if (url.includes('localhost')) {
    url = url
      .replace('localhost', '192.168.1.74')
      .replace('127.0.0.1', '192.168.1.74');
  }
  console.log(`[SocketManager] Connecting to socket at: ${url}`);
  socketManager.connect(url, token, false);
}

export function disconnectSocket() {
  socketManager.disconnect();
}
