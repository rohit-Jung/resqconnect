export enum EmergencyStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_PROVIDERS = 'no_providers_available',
}

export enum EmergencyType {
  AMBULANCE = 'ambulance',
  POLICE = 'police',
  FIRE_TRUCK = 'fire_truck',
  RESCUE_TEAM = 'rescue_team',
}
