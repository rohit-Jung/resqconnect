import { redis } from './kafka.service';

// Emergency request cache keys
export const EMERGENCY_PROVIDERS_KEY = (requestId: string) => `emergency:${requestId}:providers`;
export const EMERGENCY_LOCK_KEY = (requestId: string) => `emergency:${requestId}:lock`;
export const PROVIDER_LOCATION_KEY = (providerId: string) => `provider:${providerId}:location`;

// Cache expiry times (in seconds)
export const CACHE_EXPIRY = {
  PROVIDERS_LIST: 600, // 10 minutes
  LOCK: 10, // 10 seconds
  PROVIDER_LOCATION: 3600, // 1 hour
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
 * Release a distributed lock
 */
export async function releaseLock(requestId: string): Promise<void> {
  const lockKey = EMERGENCY_LOCK_KEY(requestId);
  await redis.del(lockKey);
}

/**
 * Store the list of providers who received an emergency broadcast
 */
export async function cacheEmergencyProviders(
  requestId: string,
  providerIds: string[]
): Promise<void> {
  const key = EMERGENCY_PROVIDERS_KEY(requestId);
  await redis.set(key, JSON.stringify(providerIds), 'EX', CACHE_EXPIRY.PROVIDERS_LIST);
}

/**
 * Get the list of providers for an emergency request
 */
export async function getEmergencyProviders(requestId: string): Promise<string[]> {
  const key = EMERGENCY_PROVIDERS_KEY(requestId);
  const data = await redis.get(key);
  return data ? JSON.parse(data) : [];
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
