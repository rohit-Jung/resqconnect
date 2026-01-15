export interface ILocation {
  latitude: number;
  longitude: number;
}

export interface IEmergencyRequest {
  id: string;
  userId: string;
  emergencyType: string;
  emergencyDescription: string;
  emergencyLocation: ILocation;
  status: EmergencyStatus;
  currentLocation: ILocation;
}

export enum EmergencyStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_PROVIDERS = 'no_providers_available',
}

// Match backend ServiceTypeEnum
export enum EmergencyType {
  AMBULANCE = 'ambulance',
  POLICE = 'police',
  FIRE_TRUCK = 'fire_truck',
  RESCUE_TEAM = 'rescue_team',
}

export interface IProvider {
  id: string;
  name: string;
  phone?: string;
  ambulanceType?: string;
  vehicleNumber?: string;
  distance?: number;
  eta?: number;
}

export interface ICreateEmergencyResponse {
  emergencyRequest: IEmergencyRequest;
}
