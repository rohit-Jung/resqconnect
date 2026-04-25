import { pgEnum } from 'drizzle-orm/pg-core';

// Keep schema package self-contained.
export const serviceTypeEnum = pgEnum('service_type', [
  'ambulance',
  'police',
  'rescue_team',
  'fire_truck',
] as const);
