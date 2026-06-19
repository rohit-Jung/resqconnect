/** Generic API response wrapper matching ApiResponse class */
export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T;
  success: boolean;
}

/** Paginated response metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

/** Standard emergency request response shape */
export interface EmergencyRequestResponse {
  id: string;
  userId: string;
  emergencyType: string | null;
  emergencyDescription: string | null;
  emergencyLocation: unknown;
  requestStatus: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Standard feedback response shape */
export interface FeedbackResponse {
  id: string;
  userId: string;
  serviceProviderId: string;
  message: string | null;
  serviceRatings: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Standard user response shape (public) */
export interface UserPublicResponse {
  id: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
  role: string;
}

/** Standard provider response shape (public) */
export interface ProviderPublicResponse {
  id: string;
  name: string | null;
  phoneNumber: string | null;
  serviceType: string | null;
  currentLocation: { latitude: string; longitude: string } | null;
  vehicleNumber?: string;
}
