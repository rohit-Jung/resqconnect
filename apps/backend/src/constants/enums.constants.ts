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
export type ServiceTypeEnumVal = `${ServiceTypeEnum}`;

export enum serviceStatusEnum {
  AVAILABLE = 'available',
  ASSIGNED = 'assigned',
  OFF_DUTY = 'off_duty',
}
