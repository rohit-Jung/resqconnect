export interface ILoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    name: string;
  };
  message?: string;
}

export interface IOtpResponse {
  userId: string;
  otpToken: string;
}

export interface IRegisterResponse {
  userId?: string;
  message?: string;
}

export interface IVerifyResponse {
  message?: string;
  verified?: boolean;
  token?: string;
}

export interface IForgotPasswordResponse {
  message?: string;
  userId?: string;
}

export interface IResetPasswordResponse {
  message?: string;
}

export interface IChangePasswordResponse {
  message?: string;
}

// Organization Types - matches backend ServiceTypeEnum
export type ServiceCategory =
  | 'ambulance'
  | 'police'
  | 'rescue_team'
  | 'fire_truck';

export type ServiceType = 'ambulance' | 'police' | 'fire_truck' | 'rescue_team';

export type ServiceStatus = 'available' | 'assigned' | 'off_duty';

export interface IOrgLoginResponse {
  token: string;
  organization: {
    id: string;
    name: string;
    email: string;
    serviceCategory: ServiceCategory;
    role: string;
  };
  message?: string;
}

export interface IOrgRegisterResponse {
  userId?: string;
  message?: string;
}

export interface IOrgVerifyResponse {
  message?: string;
  verified?: boolean;
  token?: string;
}

export interface IOrgProfileResponse {
  id: string;
  name: string;
  email: string;
  serviceCategory: ServiceCategory;
  generalNumber: number;
  role: string;
}

// Service Provider Types
export interface IServiceProviderLoginResponse {
  token: string;
  serviceProvider: {
    id: string;
    name: string;
    email: string;
    phoneNumber: number;
    serviceType: ServiceType;
    serviceStatus: ServiceStatus;
    organizationId: string;
  };
  message?: string;
}

export interface IServiceProviderRegisterResponse {
  userId?: string;
  message?: string;
}

export interface IServiceProviderVerifyResponse {
  message?: string;
  verified?: boolean;
  token?: string;
}

export interface IServiceProviderProfileResponse {
  id: string;
  name: string;
  age: number;
  email: string;
  phoneNumber: number;
  primaryAddress: string;
  serviceArea: string;
  serviceType: ServiceType;
  serviceStatus: ServiceStatus;
  profilePicture?: string;
  isVerified: boolean;
  currentLocation?: {
    latitude: string;
    longitude: string;
  };
  vehicleInformation?: {
    type: string;
    number: string;
    model: string;
    color: string;
  };
  organizationId: string;
  organization?: {
    id: string;
    name: string;
    email: string;
    serviceCategory: ServiceCategory;
  };
  createdAt: string;
  updatedAt: string;
}

// Dashboard Analytics Types
export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'assigned'
  | 'rejected'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_providers_available';

export type ResponseStatusUpdate =
  | 'accepted'
  | 'arrived'
  | 'on_route'
  | 'rejected';

export interface IRecentProvider {
  id: string;
  name: string;
  email: string;
  serviceStatus: ServiceStatus;
  isVerified: boolean;
  createdAt: string;
}

export interface IRecentEmergencyRequest {
  id: string;
  serviceType: ServiceCategory;
  requestStatus: RequestStatus;
  description: string | null;
  location: {
    latitude: string;
    longitude: string;
    address?: string;
  };
  createdAt: string;
}

export interface IRecentEmergencyResponse {
  id: string;
  statusUpdate: ResponseStatusUpdate;
  respondedAt: string | null;
  providerName: string;
  createdAt: string;
}

export interface IOrgDashboardAnalytics {
  organization: {
    id: string;
    name: string;
    serviceCategory: ServiceCategory;
  };
  providers: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    available: number;
    availabilityPercentage: number;
    recent: IRecentProvider[];
  };
  emergencyRequests: {
    total: number;
    thisMonth: number;
    pending: number;
    completed: number;
    recent: IRecentEmergencyRequest[];
  };
  emergencyResponses: {
    total: number;
    thisMonth: number;
    lastMonth: number;
    recent: IRecentEmergencyResponse[];
  };
}
