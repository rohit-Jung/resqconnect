import { useCallback, useEffect, useRef, useState } from 'react';

import {
  SyncSummary,
  createAutoSyncListener,
  syncOfflineQueue,
} from '@/services/syncService';

type ConnectionType = 'unknown' | 'online' | 'offline';

interface NetworkStatus {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  connectionType: ConnectionType;
  isWifi: boolean;
  isCellular: boolean;
  isOffline: boolean;
}

interface UseNetworkStatusOptions {
  // Interval to check connectivity (default: 10000)
  pollInterval?: number;
  // auto-sync of offline queue when coming back online
  autoSync?: boolean;
  // Callback when connectivity changes
  onConnectivityChange?: (isOnline: boolean, wasOffline: boolean) => void;
  // Callback when auto-sync completes
  onSyncComplete?: (summary: SyncSummary) => void;
}

/**
 * Hook to monitor network connectivity status
 * Uses fetch to check actual internet connectivity
 * @param options Configuration options
 * @returns NetworkStatus object with connection details and utility functions
 */
export const useNetworkStatus = (options: UseNetworkStatusOptions = {}) => {
  const {
    pollInterval = 10000,
    autoSync = true,
    onConnectivityChange,
    onSyncComplete,
  } = options;

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    connectionType: 'unknown',
    isWifi: false,
    isCellular: false,
    isOffline: false,
  });

  // Track previous status for change detection
  const previousStatusRef = useRef<boolean | null>(null);
  const isMountedRef = useRef(true);

  // Auto-sync listener
  const autoSyncListener = useRef(
    createAutoSyncListener(summary => {
      if (onSyncComplete && isMountedRef.current) {
        onSyncComplete(summary);
      }
    })
  );

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
      const wasOffline = previousStatusRef.current === false;

      // Update state
      if (isMountedRef.current) {
        setNetworkStatus({
          isConnected: isOnline,
          isInternetReachable: isOnline,
          connectionType: isOnline ? 'online' : 'offline',
          isWifi: false, // Can't determine without native module
          isCellular: false, // Can't determine without native module
          isOffline: !isOnline,
        });
      }

      // Detect connectivity change
      if (
        previousStatusRef.current !== null &&
        previousStatusRef.current !== isOnline
      ) {
        // Connectivity changed!
        if (onConnectivityChange && isMountedRef.current) {
          onConnectivityChange(isOnline, wasOffline);
        }

        // Auto-sync when coming back online
        if (isOnline && wasOffline && autoSync) {
          autoSyncListener.current(true);
        }
      }

      previousStatusRef.current = isOnline;
    } catch {
      const wasOffline = previousStatusRef.current === false;

      // Network request failed - likely offline
      if (isMountedRef.current) {
        setNetworkStatus({
          isConnected: false,
          isInternetReachable: false,
          connectionType: 'offline',
          isWifi: false,
          isCellular: false,
          isOffline: true,
        });
      }

      // Detect change to offline
      if (
        previousStatusRef.current !== null &&
        previousStatusRef.current !== false
      ) {
        if (onConnectivityChange && isMountedRef.current) {
          onConnectivityChange(false, wasOffline);
        }
      }

      previousStatusRef.current = false;
    }
  }, [autoSync, onConnectivityChange]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return checkConnectivity();
  }, [checkConnectivity]);

  // Manual sync trigger
  const triggerSync = useCallback(async (): Promise<SyncSummary | null> => {
    if (!networkStatus.isConnected) {
      console.log('[useNetworkStatus] Cannot sync while offline');
      return null;
    }

    const summary = await syncOfflineQueue();
    if (onSyncComplete && isMountedRef.current) {
      onSyncComplete(summary);
    }
    return summary;
  }, [networkStatus.isConnected, onSyncComplete]);

  useEffect(() => {
    isMountedRef.current = true;

    // Check immediately
    checkConnectivity();

    // Poll at specified interval
    const interval = setInterval(checkConnectivity, pollInterval);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [checkConnectivity, pollInterval]);

  return {
    ...networkStatus,
    refresh,
    triggerSync,
  };
};

// simple function to check if currently online (for one-time checks)
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

/**
 * Hook specifically for emergency forms with built-in offline handling
 */
export const useEmergencyNetworkStatus = (
  onOfflineDetected?: () => void,
  onBackOnline?: (syncSummary: SyncSummary) => void
) => {
  return useNetworkStatus({
    pollInterval: 5000, // More frequent checks for emergencies
    autoSync: true,
    onConnectivityChange: (isOnline, wasOffline) => {
      if (!isOnline && onOfflineDetected) {
        onOfflineDetected();
      }
    },
    onSyncComplete: summary => {
      if (onBackOnline && summary.synced > 0) {
        onBackOnline(summary);
      }
    },
  });
};

export default useNetworkStatus;
