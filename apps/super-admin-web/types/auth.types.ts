// Generic API Response wrapper
declare interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

// User/Admin Types (admin uses the user table with admin role)
export interface IUser {
  id: string;
  name: string;
  email: string;
  phoneNumber?: number;
  age?: number;
  primaryAddress?: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IAdminLoginResponse {
  user: IUser;
  token: string;
}

export interface IAdminProfileResponse {
  user: IUser;
}

// Organization Types
export interface IOrganization {
  id: string;
  name: string;
  email: string;
  generalNumber?: string;
  serviceCategory: 'ambulance' | 'police' | 'fire_brigade';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Service Provider Types
export interface IServiceProvider {
  id: string;
  name: string;
  email: string;
  phoneNumber: number;
  age: number;
  primaryAddress: string;
  serviceArea?: string;
  serviceType: 'ambulance' | 'police' | 'fire_brigade';
  isVerified: boolean;
  isAvailable: boolean;
  organizationId?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Analytics Types
export interface IDashboardStats {
  total: number;
  thisMonth: number;
  lastMonth: number;
}

export interface IDashboardEntity {
  name: string;
  email: string;
  createdAt: string;
}

export interface IDashboardAnalytics {
  orgs: IDashboardStats & { info: IDashboardEntity[] };
  users: IDashboardStats & { info: IDashboardEntity[] };
  providers: IDashboardStats & { info: IDashboardEntity[] };
}

// Legacy exports for backward compatibility
export interface ISuperAdminLoginResponse extends IAdminLoginResponse {}
export interface ISuperAdminProfileResponse extends IAdminProfileResponse {}

// Verify response
export interface IAdminVerifyResponse {
  user: {
    id: string;
    name: string;
    phoneNumber?: number;
    isVerified: boolean;
  };
  token?: string;
}

// OTP response when user needs verification
export interface IOtpResponse {
  userId: string;
  otpToken: string;
}
