import api from '../axiosInstance';
import { userEndpoints } from '../endPoints';

export interface EmergencySettings {
  notifyEmergencyContacts: boolean;
  emergencyNotificationMethod: 'sms' | 'push' | 'both';
}

export interface UpdateProfileData {
  name?: string;
  age?: number;
  phoneNumber?: number;
  primaryAddress?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  phoneNumber: number;
  primaryAddress: string;
  profilePicture?: string;
  role: string;
  isVerified: boolean;
  notifyEmergencyContacts: boolean;
  emergencyNotificationMethod: string;
}

export const userApi = {
  // Get user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get(userEndpoints.profile);
    return response.data.data.user;
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await api.put(userEndpoints.updateProfile, data);
    return response.data.data.user;
  },

  // Get emergency notification settings
  getEmergencySettings: async (): Promise<EmergencySettings> => {
    const response = await api.get(userEndpoints.emergencySettings);
    return response.data.data;
  },

  // Update emergency notification settings
  updateEmergencySettings: async (data: Partial<EmergencySettings>): Promise<EmergencySettings> => {
    const response = await api.put(userEndpoints.emergencySettings, data);
    return response.data.data;
  },

  // Update push token
  updatePushToken: async (pushToken: string): Promise<void> => {
    await api.post(userEndpoints.updatePushToken, { pushToken });
  },
};

export default userApi;
