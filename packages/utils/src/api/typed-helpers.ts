/**
 * Typed helpers to eliminate `as any` casts in controller/service code.
 *
 * These exist because Express 5 strict params + Drizzle's strict column types
 * often fight with real-world runtime shapes.
 */

// Route params

/** Extract and validate a route param as a string. */
export function getRouteParam(
  params: Record<string, unknown> | undefined,
  name: string
): string | undefined {
  if (!params) return undefined;
  const raw = params[name];
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string')
    return raw[0];
  return undefined;
}

/** Extract a required route param, throwing if missing. */
export function requireRouteParam(
  params: Record<string, unknown> | undefined,
  name: string
): string {
  const val = getRouteParam(params, name);
  if (!val) throw new Error(`Missing required route param: ${name}`);
  return val;
}

/** Extract a route param as an unknown, for zod-safeParse style validation. */
export function routeParamAsUnknown(
  params: Record<string, unknown> | undefined,
  name: string
): unknown {
  return getRouteParam(params, name);
}

// Drizzle enum helpers

/**
 * Cast a string value to a Drizzle enum type.
 * Use when you have validated the value at runtime via zod or manual check.
 */
export function asEnum<T extends string>(value: string): T {
  return value as T;
}

/**
 * Check if a string is a valid enum value (replaces `Object.values(E).includes(x as any)`).
 */
export function isValidEnum<T extends string>(
  value: string,
  enumValues: readonly T[]
): value is T {
  return (enumValues as readonly string[]).includes(value);
}

// Drizzle JSON column helper

/**
 * Type a JSON value for Drizzle's `$type<T>()` columns.
 * Use when you have validated the shape at runtime.
 */
export function asJson<T>(value: unknown): T {
  return value as T;
}

// Kafka message value

/** Safely parse a Kafka message value string. */
export function parseKafkaMessage<T = unknown>(
  value: string | null | undefined
): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}
