import AsyncStorage from '@react-native-async-storage/async-storage';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Offline queue item structure
 * Represents an emergency request that failed to submit online
 */
export interface OfflineQueueItem {
  id: string;
  emergencyType: string;
  location: {
    latitude: number;
    longitude: number;
  };
  description?: string;
  createdAt: string;
  retryCount: number;
  lastRetryAt?: string;
  status: 'pending' | 'retrying' | 'failed' | 'synced' | 'sent_via_sms';
  error?: string;
  userId?: string;
  userName?: string;
  userPhone?: string;
}

/**
 * Generate a unique local ID for queue items
 */
const generateLocalId = (): string => {
  return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

interface OfflineQueueState {
  // Queue of pending emergency requests
  queue: OfflineQueueItem[];

  // Whether we're currently syncing
  isSyncing: boolean;

  // Last successful sync timestamp
  lastSyncAt: string | null;

  // Actions
  addToQueue: (
    item: Omit<OfflineQueueItem, 'id' | 'createdAt' | 'retryCount' | 'status'>
  ) => string;
  removeFromQueue: (id: string) => void;
  updateQueueItem: (id: string, updates: Partial<OfflineQueueItem>) => void;
  markAsSynced: (id: string) => void;
  markAsSentViaSMS: (id: string) => void;
  markAsFailed: (id: string, error: string) => void;
  incrementRetry: (id: string) => void;
  clearSyncedItems: () => void;
  clearAllItems: () => void;
  setIsSyncing: (syncing: boolean) => void;
  setLastSyncAt: (timestamp: string) => void;

  // Getters
  getPendingItems: () => OfflineQueueItem[];
  getQueueCount: () => number;
  hasUnsynced: () => boolean;
}

const MAX_RETRY_COUNT = 3;

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isSyncing: false,
      lastSyncAt: null,

      addToQueue: item => {
        const id = generateLocalId();
        const newItem: OfflineQueueItem = {
          ...item,
          id,
          createdAt: new Date().toISOString(),
          retryCount: 0,
          status: 'pending',
        };

        set(state => ({
          queue: [...state.queue, newItem],
        }));

        return id;
      },

      removeFromQueue: id => {
        set(state => ({
          queue: state.queue.filter(item => item.id !== id),
        }));
      },

      updateQueueItem: (id, updates) => {
        set(state => ({
          queue: state.queue.map(item =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      markAsSynced: id => {
        set(state => ({
          queue: state.queue.map(item =>
            item.id === id ? { ...item, status: 'synced' as const } : item
          ),
        }));
      },

      markAsSentViaSMS: id => {
        set(state => ({
          queue: state.queue.map(item =>
            item.id === id ? { ...item, status: 'sent_via_sms' as const } : item
          ),
        }));
      },

      markAsFailed: (id, error) => {
        set(state => ({
          queue: state.queue.map(item =>
            item.id === id
              ? { ...item, status: 'failed' as const, error }
              : item
          ),
        }));
      },

      incrementRetry: id => {
        set(state => ({
          queue: state.queue.map(item => {
            if (item.id !== id) return item;

            const newRetryCount = item.retryCount + 1;
            return {
              ...item,
              retryCount: newRetryCount,
              lastRetryAt: new Date().toISOString(),
              status:
                newRetryCount >= MAX_RETRY_COUNT
                  ? ('failed' as const)
                  : ('retrying' as const),
            };
          }),
        }));
      },

      clearSyncedItems: () => {
        set(state => ({
          queue: state.queue.filter(
            item => item.status !== 'synced' && item.status !== 'sent_via_sms'
          ),
        }));
      },

      clearAllItems: () => {
        set({ queue: [] });
      },

      setIsSyncing: isSyncing => {
        set({ isSyncing });
      },

      setLastSyncAt: timestamp => {
        set({ lastSyncAt: timestamp });
      },

      // Getters
      getPendingItems: () => {
        const { queue } = get();
        return queue.filter(
          item =>
            item.status === 'pending' ||
            (item.status === 'retrying' && item.retryCount < MAX_RETRY_COUNT)
        );
      },

      getQueueCount: () => {
        return get().queue.length;
      },

      hasUnsynced: () => {
        const { queue } = get();
        return queue.some(
          item =>
            item.status === 'pending' ||
            item.status === 'retrying' ||
            item.status === 'failed'
        );
      },
    }),
    {
      name: 'offline-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        queue: state.queue,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);

// get pending items count for badges/indicators
export const usePendingCount = () => {
  const queue = useOfflineQueueStore(state => state.queue);
  return queue.filter(
    item =>
      item.status === 'pending' ||
      item.status === 'retrying' ||
      item.status === 'failed'
  ).length;
};

// check if there are any items that need attention
export const useHasOfflineItems = () => {
  const queue = useOfflineQueueStore(state => state.queue);
  return queue.length > 0;
};

export default useOfflineQueueStore;
