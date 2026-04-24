import { Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TOKEN_KEY } from '@/constants';
import { useLoadFonts } from '@/hooks/useLoadFonts';
import TanstackQueryClientProvider from '@/providers/react-query.provider';
import api from '@/services/axiosInstance';
import { userEndpoints } from '@/services/endPoints';
import { connectToSocketServer } from '@/socket';
import { useAuthStore } from '@/store/authStore';

import '../global.css';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useLoadFonts();
  const { user, setUser, isLoading, setUserType, userType } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Wait for store to rehydrate before checking auth
    if (isLoading) {
      console.log('Waiting for store rehydration...', {
        isLoading,
      });
      return;
    }

    // Only run auth check once
    if (hasCheckedAuth.current) {
      return;
    }
    hasCheckedAuth.current = true;

    const checkAuthAndFetchProfile = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        console.log(
          'Auth Check - Token exists:',
          !!token,
          'User:',
          !!user,
          'UserType:',
          userType
        );

        // If no token, clear any cached auth state
        if (!token) {
          console.log('No token found, clearing auth state');
          if (user) setUser(null);
          if (userType) setUserType(null);
          setIsCheckingAuth(false);
          return;
        }

        // If we already have user data from persistence, skip fetch
        if (user) {
          console.log('User already exists from persistence, skipping fetch');
          setIsCheckingAuth(false);
          return;
        }

        try {
          console.log('Attempting to fetch user profile...');
          const response = await api.get(userEndpoints.profile);
          const profileData = response.data?.data?.user;

          if (profileData) {
            console.log('User profile fetched successfully');
            setUser(profileData);
            setUserType('user');
            setIsCheckingAuth(false);
            return;
          }
        } catch (userError: any) {
          console.log(
            'User profile fetch failed:',
            userError?.response?.status || userError.message
          );
        }

        // If profile fetch fails (401), clear the token
        console.log('Profile fetch failed, clearing auth state');
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setUser(null);
        setUserType(null);
      } catch (err) {
        console.error('Auth check error:', err);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setUser(null);
        setUserType(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndFetchProfile();
  }, [isLoading, setUser, setUserType, user, userType]);

  useEffect(() => {
    if ((loaded || error) && !isCheckingAuth && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isCheckingAuth, isLoading]);

  useEffect(() => {
    if (!user) return;

    const initSocket = async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        connectToSocketServer({ token });
      }
    };

    initSocket();
  }, [user]);

  if (!loaded && !error) {
    return null;
  }

  if (isCheckingAuth || isLoading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <TanstackQueryClientProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </TanstackQueryClientProvider>
    </SafeAreaProvider>
  );
}
