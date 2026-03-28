import { redis } from './kafka/kafka.service';

// request cache keys
export const EMERGENCY_PROVIDERS_KEY = (requestId: string) =>
  `emergency:${requestId}:providers`;
export const EMERGENCY_LOCK_KEY = (requestId: string) =>
  `emergency:${requestId}:lock`;
export const PROVIDER_LOCATION_KEY = (providerId: string) =>
  `provider:${providerId}:location`;

// SMS deduplication keys
export const SMS_PROCESSED_KEY = (messageSid: string) =>
  `sms:processed:${messageSid}`;
export const SMS_LAST_POLL_KEY = 'sms:last_poll_timestamp';

export const CACHE_EXPIRY = {
  PROVIDERS_LIST: 600,
  LOCK: 10,
  PROVIDER_LOCATION: 3600,
  SMS_PROCESSED: 86400, // 24 hours - to prevent reprocessing
  SMS_LAST_POLL: 3600,
};

/**
 * Acquire a distributed lock for emergency request acceptance
 * Uses Redis SET NX EX pattern for atomic lock acquisition
 */
export async function acquireLock(
  requestId: string,
  providerId: string,
  ttlSeconds: number = CACHE_EXPIRY.LOCK
): Promise<boolean> {
  const lockKey = EMERGENCY_LOCK_KEY(requestId);
  const result = await redis.set(lockKey, providerId, 'EX', ttlSeconds, 'NX');
  return result === 'OK';
}

/**
 * Release a distributed lock (only if we own it)
 * Uses Lua script for atomic check-and-delete
 */
export async function releaseLock(
  requestId: string,
  providerId?: string
): Promise<boolean> {
  const lockKey = EMERGENCY_LOCK_KEY(requestId);

  if (providerId) {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    const result = await redis.eval(script, 1, lockKey, providerId);
    return result === 1;
  } else {
    // Force release (for cleanup)
    await redis.del(lockKey);
    return true;
  }
}

/**
 * Store the list of providers who received an emergency broadcast
 */
export async function cacheEmergencyProviders(
  requestId: string,
  providerIds: string[]
): Promise<void> {
  const key = EMERGENCY_PROVIDERS_KEY(requestId);
  await redis.set(
    key,
    JSON.stringify(providerIds),
    'EX',
    CACHE_EXPIRY.PROVIDERS_LIST
  );
}

export async function getEmergencyProviders(
  requestId: string
): Promise<string[]> {
  const key = EMERGENCY_PROVIDERS_KEY(requestId);
  const data = await redis.get(key);
  return data ? JSON.parse(data) : [];
}

/**
 * Clear the list of providers for an emergency request (used when request is cancelled/completed)
 */
export async function clearEmergencyProviders(
  requestId: string
): Promise<void> {
  const key = EMERGENCY_PROVIDERS_KEY(requestId);
  await redis.del(key);
}

/**
 * Store provider's current location
 */
export async function cacheProviderLocation(
  providerId: string,
  location: { lat: number; lng: number; timestamp: number; requestId?: string }
): Promise<void> {
  const key = PROVIDER_LOCATION_KEY(providerId);
  await redis.hset(key, {
    lat: location.lat.toString(),
    lng: location.lng.toString(),
    timestamp: location.timestamp.toString(),
    requestId: location.requestId || '',
  });
  await redis.expire(key, CACHE_EXPIRY.PROVIDER_LOCATION);
}

/**
 * Get provider's cached location
 */
export async function getProviderLocation(providerId: string): Promise<{
  lat: number;
  lng: number;
  timestamp: number;
  requestId: string;
} | null> {
  const key = PROVIDER_LOCATION_KEY(providerId);
  const data = await redis.hgetall(key);

  if (!data || !data.lat || !data.lng || !data.timestamp) return null;

  return {
    lat: parseFloat(data.lat),
    lng: parseFloat(data.lng),
    timestamp: parseInt(data.timestamp, 10),
    requestId: data.requestId || '',
  };
}

/**
 * Get all active provider locations (for batch persistence)
 */
export async function getAllActiveProviderLocations(): Promise<
  Array<{
    providerId: string;
    lat: number;
    lng: number;
    timestamp: number;
    requestId: string;
  }>
> {
  const pattern = 'provider:*:location';
  const keys: string[] = [];

  // Scan for all matching keys
  let cursor = '0';
  do {
    const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = result[0];
    keys.push(...result[1]);
  } while (cursor !== '0');

  const locations: Array<{
    providerId: string;
    lat: number;
    lng: number;
    timestamp: number;
    requestId: string;
  }> = [];

  for (const key of keys) {
    const data = await redis.hgetall(key);
    if (data && data.lat && data.lng && data.timestamp) {
      // Extract providerId from key: provider:{providerId}:location
      const providerId = key.split(':')[1];
      if (providerId) {
        locations.push({
          providerId,
          lat: parseFloat(data.lat),
          lng: parseFloat(data.lng),
          timestamp: parseInt(data.timestamp, 10),
          requestId: data.requestId || '',
        });
      }
    }
  }

  return locations;
}

export { redis };

// SMS Deduplication Functions
/**
 * Check if an SMS message has already been processed
 */
export async function isMessageProcessed(messageSid: string): Promise<boolean> {
  const key = SMS_PROCESSED_KEY(messageSid);
  const exists = await redis.exists(key);
  return exists === 1;
}

/**
 * Mark an SMS message as processed
 */
export async function markMessageProcessed(
  messageSid: string,
  metadata?: {
    requestId?: string;
    userId?: string;
    status: 'success' | 'failed' | 'invalid';
    error?: string;
  }
): Promise<void> {
  const key = SMS_PROCESSED_KEY(messageSid);
  const value = JSON.stringify({
    processedAt: new Date().toISOString(),
    ...metadata,
  });
  await redis.set(key, value, 'EX', CACHE_EXPIRY.SMS_PROCESSED);
}

/**
 * Get processing metadata for a message
 */
export async function getMessageProcessingInfo(messageSid: string): Promise<{
  processedAt: string;
  requestId?: string;
  userId?: string;
  status: 'success' | 'failed' | 'invalid';
  error?: string;
} | null> {
  const key = SMS_PROCESSED_KEY(messageSid);
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

/**
 * Get the last poll timestamp for SMS messages
 * Used to only fetch messages newer than the last poll
 */
export async function getLastSMSPollTimestamp(): Promise<Date | null> {
  const timestamp = await redis.get(SMS_LAST_POLL_KEY);
  return timestamp ? new Date(timestamp) : null;
}

/**
 * Update the last poll timestamp for SMS messages
 */
export async function setLastSMSPollTimestamp(timestamp: Date): Promise<void> {
  await redis.set(
    SMS_LAST_POLL_KEY,
    timestamp.toISOString(),
    'EX',
    CACHE_EXPIRY.SMS_LAST_POLL
  );
}

/**
 * Batch check if multiple messages have been processed
 */
export async function batchCheckMessagesProcessed(
  messageSids: string[]
): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();

  if (messageSids.length === 0) {
    return result;
  }

  // Use pipeline for efficiency
  const pipeline = redis.pipeline();
  messageSids.forEach(sid => {
    pipeline.exists(SMS_PROCESSED_KEY(sid));
  });

  const responses = await pipeline.exec();

  messageSids.forEach((sid, index) => {
    const [err, exists] = responses?.[index] || [null, 0];
    result.set(sid, !err && exists === 1);
  });

  return result;
}
