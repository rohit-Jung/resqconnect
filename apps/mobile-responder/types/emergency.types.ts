import { EmergencyStatus } from '@repo/types/constants';

export { EmergencyStatus, EmergencyType } from '@repo/types/constants';

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

export interface IEmergencyHistoryItem {
  id: string;
  emergencyType: string;
  emergencyDescription: string;
  status: EmergencyStatus;
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  emergencyLocation: ILocation;
  provider?: {
    id: string;
    name: string;
    phoneNumber?: string;
    vehicleNumber?: string;
    serviceType: string;
  };
  user?: {
    id: string;
    name: string;
    phoneNumber?: string;
  };
  responseTime?: number;
  distanceTraveled?: number;
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
