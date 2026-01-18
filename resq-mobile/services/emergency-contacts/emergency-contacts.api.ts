import api from '../axiosInstance';
import { emergencyContactEndpoints } from '../endPoints';

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  email?: string;
  notifyOnEmergency: boolean;
  notificationMethod: 'sms' | 'push' | 'both';
  pushToken?: string;
  isCommanContact: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmergencyContactData {
  name: string;
  phoneNumber: string;
  relationship: string;
  email?: string;
  notifyOnEmergency?: boolean;
  notificationMethod?: 'sms' | 'push' | 'both';
}

export interface UpdateEmergencyContactData {
  name?: string;
  phoneNumber?: string;
  relationship?: string;
  email?: string;
  notifyOnEmergency?: boolean;
  notificationMethod?: 'sms' | 'push' | 'both';
}

export const emergencyContactsApi = {
  // Get all emergency contacts for the user
  getAll: async (): Promise<EmergencyContact[]> => {
    const response = await api.get(emergencyContactEndpoints.getAll);
    return response.data.data;
  },

  // Get a single emergency contact by ID
  getById: async (id: string): Promise<EmergencyContact> => {
    const response = await api.get(emergencyContactEndpoints.getById(id));
    return response.data.data;
  },

  // Create a new emergency contact
  create: async (data: CreateEmergencyContactData): Promise<EmergencyContact> => {
    const response = await api.post(emergencyContactEndpoints.create, data);
    return response.data.data;
  },

  // Update an emergency contact
  update: async (id: string, data: UpdateEmergencyContactData): Promise<EmergencyContact> => {
    const response = await api.put(emergencyContactEndpoints.update(id), data);
    return response.data.data;
  },

  // Delete an emergency contact
  delete: async (id: string): Promise<void> => {
    await api.delete(emergencyContactEndpoints.delete(id));
  },

  // Toggle notification setting for a contact
  toggleNotification: async (id: string): Promise<EmergencyContact> => {
    const response = await api.patch(emergencyContactEndpoints.toggleNotification(id));
    return response.data.data;
  },

  // Update push token for a contact (if they have the app)
  updatePushToken: async (id: string, pushToken: string): Promise<EmergencyContact> => {
    const response = await api.patch(emergencyContactEndpoints.updatePushToken(id), { pushToken });
    return response.data.data;
  },

  // Get common emergency contacts (like 911, police, etc.)
  getCommon: async (): Promise<EmergencyContact[]> => {
    const response = await api.get(emergencyContactEndpoints.getCommon);
    return response.data.data;
  },
};

export default emergencyContactsApi;
