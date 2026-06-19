/**
 * Typed API endpoint contracts.
 * Each endpoint maps to its request shape and response shape.
 * Frontend API clients import these for type-safe HTTP calls.
 */

// Generic API response wrapper

export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
  success: boolean;
}

// Auth endpoints

export namespace AuthEndpoints {
  export type LoginRequest = { email: string; password: string };
  export type LoginResponse = {
    token: string;
    user: { id: string; name: string; email: string; role: string };
  };

  export type RegisterRequest = {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
  };
  export type RegisterResponse = { id: string; name: string; email: string };

  export type VerifyOtpRequest = { email: string; otp: string };
  export type VerifyOtpResponse = { verified: boolean };
}

// User endpoints

export namespace UserEndpoints {
  export type ProfileResponse = {
    id: string;
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
    role: string;
    createdAt: string;
  };

  export type UpdateProfileRequest = {
    name?: string;
    primaryAddress?: string;
    age?: number;
  };
}

// Emergency Request endpoints

export namespace EmergencyEndpoints {
  export type CreateRequest = {
    emergencyType: string;
    emergencyDescription?: string;
    userLocation: { latitude: number; longitude: number };
  };
  export type CreateResponse = {
    emergencyRequest: {
      id: string;
      serviceType: string;
      requestStatus: string;
      createdAt: string;
    };
  };

  export type RequestDetail = {
    id: string;
    userId: string;
    serviceType: string;
    description: string | null;
    location: { latitude: number; longitude: number } | null;
    requestStatus: string;
    createdAt: string;
    updatedAt: string;
  };

  export type HistoryResponse = {
    history: RequestDetail[];
    stats: { total: number; completed: number; cancelled: number };
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    };
  };
}

// Feedback endpoints

export namespace FeedbackEndpoints {
  export type CreateRequest = {
    serviceProviderId: string;
    message: string;
    serviceRatings: number;
  };
  export type CreateResponse = {
    feedback: {
      id: string;
      userId: string;
      serviceProviderId: string;
      message: string | null;
      serviceRatings: number | null;
      createdAt: string;
    };
  };
}

// Organization endpoints

export namespace OrganizationEndpoints {
  export type RegisterRequest = {
    name: string;
    email: string;
    password: string;
    serviceCategory: string;
    generalNumber: string;
  };
  export type RegisterResponse = { id: string; name: string; email: string };

  export type LoginRequest = { email: string; password: string };
  export type LoginResponse = {
    token: string;
    organization: {
      id: string;
      name: string;
      email: string;
      serviceCategory: string;
      isVerified: boolean;
      lifecycleStatus: string;
    };
  };
}

// Service Provider endpoints

export namespace ServiceProviderEndpoints {
  export type RegisterRequest = {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    serviceType: string;
    organizationId: string;
  };
  export type LoginRequest = { email: string; password: string };
  export type LoginResponse = {
    token: string;
    provider: {
      id: string;
      name: string;
      email: string;
      serviceType: string;
      documentStatus: string;
    };
  };

  export type NearbyProvider = {
    id: string;
    name: string | null;
    serviceType: string | null;
    currentLocation: { latitude: string; longitude: string } | null;
    distance: number;
  };
}
