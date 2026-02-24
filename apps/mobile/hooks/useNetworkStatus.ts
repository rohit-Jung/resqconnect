import { useCallback, useEffect, useState } from 'react';

type ConnectionType = 'unknown' | 'online' | 'offline';

interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  connectionType: ConnectionType;
  isWifi: boolean;
  isCellular: boolean;
  isOffline: boolean;
}

/**
 * Hook to monitor network connectivity status
 * Uses fetch to check actual internet connectivity
 * @returns NetworkStatus object with connection details
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'unknown',
    isWifi: false,
    isCellular: false,
    isOffline: false,
  });

  const checkConnectivity = useCallback(async () => {
    try {
      // Try to fetch a small resource to verify actual connectivity
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-store',
      });

      clearTimeout(timeoutId);

      const isOnline = response.ok || response.status === 204;

      setNetworkStatus({
        isConnected: isOnline,
        isInternetReachable: isOnline,
        connectionType: isOnline ? 'online' : 'offline',
        isWifi: false, // Can't determine without native module
        isCellular: false, // Can't determine without native module
        isOffline: !isOnline,
      });
    } catch (error) {
      // Network request failed - likely offline
      setNetworkStatus({
        isConnected: false,
        isInternetReachable: false,
        connectionType: 'offline',
        isWifi: false,
        isCellular: false,
        isOffline: true,
      });
    }
  }, []);

  useEffect(() => {
    // Check immediately
    checkConnectivity();

    // Poll every 10 seconds
    const interval = setInterval(checkConnectivity, 10000);

    return () => clearInterval(interval);
  }, [checkConnectivity]);

  return networkStatus;
};

/**
 * Simple function to check if currently online (for one-time checks)
 */
export const checkNetworkStatus = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);
    return response.ok || response.status === 204;
  } catch {
    return false;
  }
};

export default useNetworkStatus;
