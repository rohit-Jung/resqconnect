import AsyncStorage from '@react-native-async-storage/async-storage';

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { TOKEN_KEY } from '@/constants';

export type UserType = 'user' | 'service_provider';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  phoneNumber?: number;
  age?: number;
  primaryAddress?: string;
  profilePicture?: string | null;
  role?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  userType: UserType | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setUserType: (userType: UserType | null) => void;
  login: (user: User, token: string, userType: UserType) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  updateProfilePicture: (profilePicture: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      token: null,
      userType: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: user =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setToken: token => set({ token }),

      setUserType: userType => set({ userType }),

      login: (user, token, userType) =>
        set({
          user,
          token,
          userType,
          isAuthenticated: true,
          isLoading: false,
        }),

      logout: async () => {
        // Clear token from SecureStore
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        set({
          user: null,
          token: null,
          userType: null,
          isAuthenticated: false,
        });
      },

      setLoading: isLoading => set({ isLoading }),

      updateProfilePicture: profilePicture =>
        set(state => ({
          user: state.user ? { ...state.user, profilePicture } : null,
        })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        user: state.user,
        userType: state.userType,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[AuthStore] Rehydration error:', error);
        }

        const TIMEOUT_MS = 5000;
        let timeoutId: ReturnType<typeof setTimeout>;

        const handleTimeout = async () => {
          console.warn('[AuthStore] Rehydration timeout - clearing session');
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await AsyncStorage.removeItem('auth-storage');
          if (state) {
            state.user = null;
            state.token = null;
            state.userType = null;
            state.isAuthenticated = false;
            state.isLoading = false;
          }
        };

        timeoutId = setTimeout(handleTimeout, TIMEOUT_MS);

        if (state) {
          const originalSetLoading = state.setLoading.bind(state);
          state.setLoading = (loading: boolean) => {
            clearTimeout(timeoutId);
            originalSetLoading(loading);
          };
          state.isLoading = false;
        }
      },
    }
  )
);
