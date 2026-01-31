import api from '../axiosInstance';
import { serviceProviderEndpoints, emergencyRequestEndpoints } from '../endPoints';

export interface ServiceProviderProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  phoneNumber: number;
  primaryAddress: string;
  serviceArea: string;
  serviceType: 'ambulance' | 'police' | 'fire_truck' | 'rescue_team';
  serviceStatus: 'available' | 'assigned' | 'off_duty';
  isVerified: boolean;
  profilePicture?: string;
  currentLocation: {
    latitude: string;
    longitude: string;
  };
  vehicleInformation: {
    type: string;
    number: string;
    model: string;
    color: string;
  };
  organizationId: string;
}

export interface UpdateProviderProfileData {
  name?: string;
  age?: number;
  primaryAddress?: string;
  serviceArea?: string;
  vehicleInformation?: {
    type: string;
    number: string;
    model: string;
    color: string;
  };
}

export interface EmergencyRequestForProvider {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  serviceType: string;
  description?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  requestStatus: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  distance?: number;
  createdAt: string;
}

export const serviceProviderApi = {
  // Get provider profile
  getProfile: async (): Promise<ServiceProviderProfile> => {
    const response = await api.get(serviceProviderEndpoints.profile);
    return response.data.data.serviceProvider;
  },

  // Update provider profile
  updateProfile: async (data: UpdateProviderProfileData): Promise<ServiceProviderProfile> => {
    const response = await api.patch(serviceProviderEndpoints.updateProfile, data);
    return response.data.data.serviceProvider;
  },

  // Update service status (available, assigned, off_duty)
  updateStatus: async (
    status: 'available' | 'assigned' | 'off_duty'
  ): Promise<ServiceProviderProfile> => {
    const response = await api.patch(serviceProviderEndpoints.updateStatus, {
      status,
    });
    return response.data.data.serviceProvider;
  },

  // Get pending emergency requests for provider
  getPendingRequests: async (): Promise<EmergencyRequestForProvider[]> => {
    const response = await api.get(`${emergencyRequestEndpoints.getAll}/provider/pending`);
    return response.data.data;
  },

  // Accept an emergency request
  acceptRequest: async (requestId: string): Promise<void> => {
    await api.post(`${emergencyRequestEndpoints.getAll}/${requestId}/accept`);
  },

  // Reject an emergency request
  rejectRequest: async (requestId: string): Promise<void> => {
    await api.post(`${emergencyRequestEndpoints.getAll}/${requestId}/reject`);
  },

  // Complete an emergency request
  completeRequest: async (requestId: string): Promise<void> => {
    await api.post(`${emergencyRequestEndpoints.getAll}/${requestId}/complete`);
  },

  // Update provider location
  updateLocation: async (latitude: number, longitude: number): Promise<void> => {
    await api.patch(serviceProviderEndpoints.updateLocation, {
      currentLocation: { latitude, longitude },
    });
  },
};

export default serviceProviderApi;
