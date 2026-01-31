import '../global.css';

import TanstackQueryClientProvider from '@/providers/react-query.provider';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState, useCallback } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useLoadFonts } from '@/hooks/useLoadFonts';
import { connectToSocketServer } from '@/socket';
import { useAuthStore } from '@/store/authStore';
import { TOKEN_KEY } from '@/constants';
import api from '@/services/axiosInstance';
import { userEndpoints } from '@/services/endPoints';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useLoadFonts();
  const { user, setUser, setLoading, isLoading } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const deleteUserInfo = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
  }

  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      try {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        console.log(":Profile Response", token, user);
        if (token && !user) {
          const response = await api.get(userEndpoints.profile);
          console.log(":Profile Response", response);
          if (!response.data?.data?.user) await deleteUserInfo();
          setUser(response.data.data.user);
        }
      } catch (err) {
        await deleteUserInfo();
      } finally {
        setIsCheckingAuth(false);
        setLoading(false);
      }
    };

    checkAuthAndFetchProfile();
  }, []);

  useEffect(() => {
    if ((loaded || error) && !isCheckingAuth) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isCheckingAuth]);

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
          }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </TanstackQueryClientProvider>
    </SafeAreaProvider>
  );
}
