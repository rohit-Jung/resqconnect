import { Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TOKEN_KEY } from '@/constants';
import { useLoadFonts } from '@/hooks/useLoadFonts';
import TanstackQueryClientProvider from '@/providers/react-query.provider';
import api from '@/services/axiosInstance';
import { serviceProviderEndpoints } from '@/services/endPoints';
import { connectToSocketServer } from '@/socket';
import { useProviderStore } from '@/store/providerStore';

import '../global.css';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useLoadFonts();
  const {
    provider,
    setProvider,
    isLoading: isProviderLoading,
  } = useProviderStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    // Wait for store to rehydrate before checking auth
    if (isProviderLoading) {
      console.log('Waiting for store rehydration...', {
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
          'Responder:',
          !!provider,
          'UserType:',
          'service_provider'
        );

        // If no token, clear any cached auth state
        if (!token) {
          console.log('No token found, clearing auth state');
          if (provider) setProvider(null);
          setIsCheckingAuth(false);
          return;
        }

        // If we already have provider data from persistence, skip fetch
        if (provider) {
          console.log(
            'Responder already exists from persistence, skipping fetch'
          );
          setIsCheckingAuth(false);
          return;
        }

        try {
          console.log('Attempting to fetch responder profile...');
          const response = await api.get(serviceProviderEndpoints.profile);
          const providerData = response.data?.data?.user;

          if (providerData) {
            console.log('Responder profile fetched successfully');
            setProvider(providerData);
            setIsCheckingAuth(false);
            return;
          }
        } catch (spError: any) {
          console.log(
            'Responder profile fetch failed:',
            spError?.response?.status || spError.message
          );
        }

        // If both profile fetches fail (401), clear the token
        console.log('Profile fetch failed, clearing auth state');
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setProvider(null);
      } catch (err) {
        console.error('Auth check error:', err);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        setProvider(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndFetchProfile();
  }, [isProviderLoading, provider, setProvider]);

  useEffect(() => {
    if ((loaded || error) && !isCheckingAuth && !isProviderLoading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isCheckingAuth, isProviderLoading]);

  useEffect(() => {
    if (!provider) return;

    const initSocket = async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        connectToSocketServer({ token });
      }
    };

    initSocket();
  }, [provider]);

  if (!loaded && !error) {
    return null;
  }

  if (isCheckingAuth || isProviderLoading) {
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
