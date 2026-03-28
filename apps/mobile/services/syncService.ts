/**
 * Sync Service
 *
 * Handles synchronization of offline queued emergency requests
 * when the device comes back online.
 */
import { AxiosError } from 'axios';

import {
  OfflineQueueItem,
  useOfflineQueueStore,
} from '@/store/offlineQueueStore';
import { TCreateEmergencyRequest } from '@/validations/emergency.schema';

import api from './axiosInstance';
import { emergencyRequestEndpoints } from './endPoints';

// Sync configuration
const SYNC_CONFIG = {
  maxRetries: 3,
  retryDelayMs: 2000,
  batchSize: 5,
  requestTimeoutMs: 30000,
};

export interface SyncResult {
  success: boolean;
  itemId: string;
  error?: string;
  requestId?: string;
}

export interface SyncSummary {
  total: number;
  synced: number;
  failed: number;
  results: SyncResult[];
}

/**
 * Convert offline queue item to API request format
 */
const queueItemToRequest = (
  item: OfflineQueueItem
): TCreateEmergencyRequest => {
  return {
    emergencyType: item.emergencyType as
      | 'ambulance'
      | 'police'
      | 'fire_truck'
      | 'rescue_team',
    userLocation: {
      latitude: item.location.latitude,
      longitude: item.location.longitude,
    },
    emergencyDescription:
      item.description || 'Emergency request (via offline sync)',
  };
};

/**
 * Sync a single emergency request to the backend
 */
const syncSingleRequest = async (
  item: OfflineQueueItem
): Promise<SyncResult> => {
  const store = useOfflineQueueStore.getState();

  try {
    // Mark as retrying
    store.updateQueueItem(item.id, { status: 'retrying' });

    const requestData = queueItemToRequest(item);

    const response = await api.post(
      emergencyRequestEndpoints.create,
      requestData,
      {
        timeout: SYNC_CONFIG.requestTimeoutMs,
      }
    );

    // Mark as synced
    store.markAsSynced(item.id);

    return {
      success: true,
      itemId: item.id,
      requestId: response.data?.data?.emergencyRequest?.id,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    const errorMessage =
      axiosError.response?.data &&
      typeof axiosError.response.data === 'object' &&
      'message' in axiosError.response.data
        ? String(axiosError.response.data.message)
        : axiosError.message || 'Unknown error occurred';

    // Increment retry count
    store.incrementRetry(item.id);

    // Check if max retries exceeded
    const updatedItem = store.queue.find(q => q.id === item.id);
    if (updatedItem && updatedItem.retryCount >= SYNC_CONFIG.maxRetries) {
      store.markAsFailed(item.id, errorMessage);
    }

    return {
      success: false,
      itemId: item.id,
      error: errorMessage,
    };
  }
};

/**
 * Sync a single request with retries
 */
const syncWithRetry = async (
  item: OfflineQueueItem,
  retryCount: number = 0
): Promise<SyncResult> => {
  const result = await syncSingleRequest(item);

  if (result.success) {
    return result;
  }

  // Check if we should retry
  if (retryCount < SYNC_CONFIG.maxRetries - 1) {
    // Wait before retrying
    await new Promise(resolve =>
      setTimeout(resolve, SYNC_CONFIG.retryDelayMs * (retryCount + 1))
    );

    return syncWithRetry(item, retryCount + 1);
  }

  return result;
};

/**
 * Main sync function - syncs all pending items in the queue
 */
export const syncOfflineQueue = async (): Promise<SyncSummary> => {
  const store = useOfflineQueueStore.getState();

  // Prevent concurrent syncs
  if (store.isSyncing) {
    return {
      total: 0,
      synced: 0,
      failed: 0,
      results: [],
    };
  }

  store.setIsSyncing(true);

  try {
    const pendingItems = store.getPendingItems();

    if (pendingItems.length === 0) {
      return {
        total: 0,
        synced: 0,
        failed: 0,
        results: [],
      };
    }

    const results: SyncResult[] = [];

    // Process in batches
    for (let i = 0; i < pendingItems.length; i += SYNC_CONFIG.batchSize) {
      const batch = pendingItems.slice(i, i + SYNC_CONFIG.batchSize);

      // Process batch concurrently
      const batchResults = await Promise.all(
        batch.map(item => syncWithRetry(item))
      );

      results.push(...batchResults);
    }

    // Update last sync timestamp
    store.setLastSyncAt(new Date().toISOString());

    // Clear synced items (optional - can be disabled to keep history)
    // store.clearSyncedItems();

    const synced = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      total: results.length,
      synced,
      failed,
      results,
    };
  } finally {
    store.setIsSyncing(false);
  }
};

/**
 * Sync a specific item by ID
 */
export const syncSingleItem = async (
  itemId: string
): Promise<SyncResult | null> => {
  const store = useOfflineQueueStore.getState();
  const item = store.queue.find(q => q.id === itemId);

  if (!item) {
    return null;
  }

  return syncWithRetry(item);
};

/**
 * Check if there are items that need syncing
 */
export const hasItemsToSync = (): boolean => {
  const store = useOfflineQueueStore.getState();
  return store.hasUnsynced();
};

/**
 * Get count of items waiting to sync
 */
export const getPendingSyncCount = (): number => {
  const store = useOfflineQueueStore.getState();
  return store.getPendingItems().length;
};

/**
 * Listener callback type for connectivity changes
 */
export type ConnectivityChangeCallback = (isConnected: boolean) => void;

/**
 * Create a connectivity listener that auto-syncs when online
 */
export const createAutoSyncListener = (
  onSyncComplete?: (summary: SyncSummary) => void
): ConnectivityChangeCallback => {
  return async (isConnected: boolean) => {
    if (isConnected && hasItemsToSync()) {
      console.log('[SyncService] Connectivity restored, starting auto-sync...');
      const summary = await syncOfflineQueue();
      console.log(
        `[SyncService] Auto-sync complete: ${summary.synced}/${summary.total} synced`
      );

      if (onSyncComplete) {
        onSyncComplete(summary);
      }
    }
  };
};

/**
 * Manual trigger to retry all failed items
 */
export const retryFailedItems = async (): Promise<SyncSummary> => {
  const store = useOfflineQueueStore.getState();

  // Reset failed items to pending
  store.queue.forEach(item => {
    if (item.status === 'failed') {
      store.updateQueueItem(item.id, {
        status: 'pending',
        retryCount: 0,
        error: undefined,
      });
    }
  });

  // Sync all pending items
  return syncOfflineQueue();
};

export default {
  syncOfflineQueue,
  syncSingleItem,
  hasItemsToSync,
  getPendingSyncCount,
  createAutoSyncListener,
  retryFailedItems,
};
