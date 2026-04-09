import { pgEnum } from 'drizzle-orm/pg-core';

import { ServiceTypeEnum } from '@/constants';

export const serviceTypeEnum = pgEnum('service_type', [
  ServiceTypeEnum.AMBULANCE,
  ServiceTypeEnum.POLICE,
  ServiceTypeEnum.RESCUE_TEAM,
  ServiceTypeEnum.FIRE_TRUCK,
] as const);
