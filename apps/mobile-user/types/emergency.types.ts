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
  searchRadius?: number;
  expiresAt?: string;
  assignedProviderId?: string;
  createdAt?: string;
  updatedAt?: string;
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

export interface INearbyProvider {
  id: string;
  name: string;
  serviceType: string;
  currentLocation: {
    latitude: string;
    longitude: string;
  };
  distance: number;
}

export interface IAssignedProvider extends INearbyProvider {
  phoneNumber?: string;
  vehicleNumber?: string;
  estimatedArrival?: number;
}

export interface ICreateEmergencyResponse {
  emergencyRequest: IEmergencyRequest;
}

// History types
export interface IEmergencyHistoryItem {
  id: string;
  emergencyType: string;
  emergencyDescription: string;
  status: EmergencyStatus;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  emergencyLocation: ILocation;
  // For user history - provider info
  provider?: {
    id: string;
    name: string;
    phoneNumber?: string;
    vehicleNumber?: string;
    serviceType: string;
  };
  // For provider history - user info
  user?: {
    id: string;
    name: string;
    phoneNumber?: string;
  };
  // Stats
  responseTime?: number; // in seconds
  distanceTraveled?: number; // in meters
}

export interface IEmergencyHistoryResponse {
  history: IEmergencyHistoryItem[];
  stats?: {
    total: number;
    completed: number;
    cancelled: number;
    avgResponseTime?: number;
  };
}
