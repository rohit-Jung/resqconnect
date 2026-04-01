import { Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TOKEN_KEY } from '@/constants';
import { useLoadFonts } from '@/hooks/useLoadFonts';
import TanstackQueryClientProvider from '@/providers/react-query.provider';
import api from '@/services/axiosInstance';
import { serviceProviderEndpoints, userEndpoints } from '@/services/endPoints';
import { connectToSocketServer } from '@/socket';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';

import '../global.css';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useLoadFonts();
  const { user, setUser, setLoading, isLoading, setUserType, userType } =
    useAuthStore();
  const {
    provider,
    setProvider,
    setLoading: setProviderLoading,
    isLoading: isProviderLoading,
  } = useProviderStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Wait for stores to rehydrate before checking auth
    if (isLoading || isProviderLoading) {
      console.log('Waiting for store rehydration...', {
        isLoading,
        isProviderLoading,
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
          'Provider:',
          !!provider,
          'UserType:',
          userType
        );

        // If no token, clear any cached auth state
        if (!token) {
          console.log('No token found, clearing auth state');
          if (user) setUser(null);
          if (userType) setUserType(null);
          if (provider) setProvider(null);
          setIsCheckingAuth(false);
          return;
        }

        // If we already have user or provider data from persistence, skip fetch
        if (user || provider) {
          console.log(
            'User or provider already exists from persistence, skipping fetch'
          );
          setIsCheckingAuth(false);
          return;
        }

        // Try to fetch user profile first
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

        // If user profile fails, try service provider
        try {
          console.log('Attempting to fetch service provider profile...');
          const response = await api.get(serviceProviderEndpoints.profile);
          const providerData = response.data?.data?.user;

          if (providerData) {
            console.log('Service provider profile fetched successfully');
            setProvider(providerData);
            setUserType('service_provider');
            setIsCheckingAuth(false);
            return;
          }
        } catch (spError: any) {
          console.log(
            'Service provider profile fetch failed:',
            spError?.response?.status || spError.message
          );
        }

        // If both profile fetches fail (401), clear the token
        console.log('Both profile fetches failed, clearing auth state');
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setUser(null);
        setUserType(null);
        setProvider(null);
      } catch (err) {
        console.error('Auth check error:', err);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setUser(null);
        setUserType(null);
        setProvider(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndFetchProfile();
  }, [
    isLoading,
    isProviderLoading,
    provider,
    setProvider,
    setUser,
    setUserType,
    user,
    userType,
  ]);

  useEffect(() => {
    if (
      (loaded || error) &&
      !isCheckingAuth &&
      !isLoading &&
      !isProviderLoading
    ) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isCheckingAuth, isLoading, isProviderLoading]);

  useEffect(() => {
    const currentUser = user || provider;
    if (!currentUser) return;

    const initSocket = async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        connectToSocketServer({ token });
      }
    };

    initSocket();
  }, [user, provider]);

  if (!loaded && !error) {
    return null;
  }

  if (isCheckingAuth || isLoading || isProviderLoading) {
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
