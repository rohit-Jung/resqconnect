import AsyncStorage from '@react-native-async-storage/async-storage';

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { TOKEN_KEY } from '@/constants';
import { TNewEmergencyEventPayload } from '@/lib/validations/socket';

export interface ServiceProvider {
  id: string;
  name: string;
  email: string;
  phoneNumber?: number;
  age?: number;
  primaryAddress?: string;
  serviceType: 'ambulance' | 'police' | 'fire_truck' | 'rescue_team';
  serviceStatus: 'available' | 'assigned' | 'off_duty';
  organizationId: string;
  vehicleInformation?: {
    type: string;
    number: string;
    model: string;
    color: string;
  };
}

// Extended type with UI-friendly computed properties
export interface IncomingRequest extends TNewEmergencyEventPayload {
  // Computed alias for emergencyLocation - for easier UI usage
  location: { latitude: number; longitude: number };
  // Computed alias for emergencyDescription
  description?: string;
}

interface ProviderState {
  provider: ServiceProvider | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  serviceStatus: 'available' | 'assigned' | 'off_duty';
  currentRequest: IncomingRequest | null;
  incomingRequests: IncomingRequest[];

  // Actions
  setProvider: (provider: ServiceProvider | null) => void;
  setToken: (token: string | null) => void;
  login: (provider: ServiceProvider, token: string) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setServiceStatus: (status: 'available' | 'assigned' | 'off_duty') => void;
  setCurrentRequest: (request: IncomingRequest | null) => void;
  addIncomingRequest: (request: IncomingRequest) => void;
  removeIncomingRequest: (requestId: string) => void;
  clearIncomingRequests: () => void;
}

export const useProviderStore = create<ProviderState>()(
  persist(
    (set, get) => ({
      provider: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      serviceStatus: 'available',
      currentRequest: null,
      incomingRequests: [],

      setProvider: provider =>
        set({
          provider,
          isAuthenticated: !!provider,
          serviceStatus: provider?.serviceStatus || 'available',
        }),

      setToken: token => set({ token }),

      login: (provider, token) =>
        set({
          provider,
          token,
          isAuthenticated: true,
          isLoading: false,
          serviceStatus: provider.serviceStatus,
        }),

      logout: async () => {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        set({
          provider: null,
          token: null,
          isAuthenticated: false,
          serviceStatus: 'available',
          currentRequest: null,
          incomingRequests: [],
        });
      },

      setLoading: isLoading => set({ isLoading }),

      setServiceStatus: status =>
        set(state => ({
          serviceStatus: status,
          provider: state.provider
            ? { ...state.provider, serviceStatus: status }
            : null,
        })),

      setCurrentRequest: request => set({ currentRequest: request }),

      addIncomingRequest: request =>
        set(state => {
          // Avoid duplicates
          const exists = state.incomingRequests.some(
            r => r.requestId === request.requestId
          );
          if (exists) return state;
          return { incomingRequests: [...state.incomingRequests, request] };
        }),

      removeIncomingRequest: requestId =>
        set(state => ({
          incomingRequests: state.incomingRequests.filter(
            r => r.requestId !== requestId
          ),
          currentRequest:
            state.currentRequest?.requestId === requestId
              ? null
              : state.currentRequest,
        })),

      clearIncomingRequests: () =>
        set({ incomingRequests: [], currentRequest: null }),
    }),
    {
      name: 'provider-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        provider: state.provider,
        isAuthenticated: state.isAuthenticated,
        serviceStatus: state.serviceStatus,
      }),
      onRehydrateStorage: () => state => {
        state?.setLoading(false);
      },
    }
  )
);
