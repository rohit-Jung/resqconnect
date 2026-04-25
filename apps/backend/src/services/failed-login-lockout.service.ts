import { getSectorConfig } from '@repo/config';

import { redis } from '@/services/redis.service';

function lockKey(subject: string) {
  return `login_lock:${subject}`;
}

function failCountKey(subject: string) {
  return `login_fail:${subject}`;
}

export async function isLoginLocked(subject: string): Promise<boolean> {
  const cfg = getSectorConfig();
  if (!cfg.compliance.failedLoginLockoutEnabled) return false;
  const exists = await redis.exists(lockKey(subject));
  return exists === 1;
}

export async function recordLoginFailure(subject: string): Promise<void> {
  const cfg = getSectorConfig();
  if (!cfg.compliance.failedLoginLockoutEnabled) return;

  const countKey = failCountKey(subject);
  const count = await redis.incr(countKey);
  if (count === 1) {
    await redis.expire(countKey, cfg.compliance.failedLoginWindowSeconds);
  }

  if (count >= cfg.compliance.failedLoginMaxAttempts) {
    await redis.set(
      lockKey(subject),
      '1',
      'EX',
      cfg.compliance.failedLoginLockSeconds
    );
  }
}

export async function clearLoginFailures(subject: string): Promise<void> {
  const cfg = getSectorConfig();
  if (!cfg.compliance.failedLoginLockoutEnabled) return;
  await redis.del(failCountKey(subject));
  await redis.del(lockKey(subject));
}
