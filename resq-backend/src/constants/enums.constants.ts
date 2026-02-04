import { pgEnum } from 'drizzle-orm/pg-core';

export enum UserRoles {
  USER = 'user',
  ADMIN = 'admin',
}

export enum OtherRoles {
  SERVICE_PROVIDER = 'service_provider',
  ORGANIZATION = 'organization',
}

export enum ServiceTypeEnum {
  AMBULANCE = 'ambulance',
  POLICE = 'police',
  RESCUE_TEAM = 'rescue_team',
  FIRE_TRUCK = 'fire_truck',
}

export const serviceTypeEnum = pgEnum('service_type', [
  ServiceTypeEnum.AMBULANCE,
  ServiceTypeEnum.POLICE,
  ServiceTypeEnum.RESCUE_TEAM,
  ServiceTypeEnum.FIRE_TRUCK,
] as const);

export enum serviceStatusEnum {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  OFF_DUTY = 'off_duty',
}

