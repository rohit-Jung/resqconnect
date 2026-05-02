import { Stack, usePathname, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TOKEN_KEY } from '@/constants';
import { getActiveEmergency } from '@/hooks/useEmergencyRoom';
import { useLoadFonts } from '@/hooks/useLoadFonts';
import { checkNetworkStatus, useNetworkStatus } from '@/hooks/useNetworkStatus';
import TanstackQueryClientProvider from '@/providers/react-query.provider';
import api from '@/services/axiosInstance';
import { emergencyRequestEndpoints, userEndpoints } from '@/services/endPoints';
import { connectToSocketServer } from '@/socket';
import { useAuthStore } from '@/store/authStore';
import { EmergencyStatus } from '@/types/emergency.types';

import '../global.css';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useLoadFonts();
  const { user, setUser, isLoading, setUserType, userType } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const hasCheckedAuth = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const lastOnlineRef = useRef<boolean | null>(null);
  const isActiveEmergencyCheckInFlight = useRef(false);
  const lastRedirectedEmergencyIdRef = useRef<string | null>(null);

  // monitor connectivity so we can re-check when coming back online.
  const { isConnected } = useNetworkStatus({
    pollInterval: 10000,
    autoSync: false,
  });

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

  useEffect(() => {
    if (!user) return;
    if (isCheckingAuth || isLoading) return;
    if (pathname === '/emergency-tracking') return;

    const maybeRedirectToActiveEmergency = async () => {
      if (isActiveEmergencyCheckInFlight.current) return;
      isActiveEmergencyCheckInFlight.current = true;

      const isOnline = await checkNetworkStatus();
      console.log('online Check', isOnline);

      if (!isOnline) {
        isActiveEmergencyCheckInFlight.current = false;
        return;
      }

      // 1) prefer local persisted active emergency (app restart scenario)
      const stored = await getActiveEmergency();
      const storedRequestId = stored?.requestId;
      console.log('Found stored', isOnline);

      if (storedRequestId) {
        try {
          const resp = await api.get(
            emergencyRequestEndpoints.getById(storedRequestId)
          );
          const req = resp.data?.data;
          const status = req?.requestStatus as EmergencyStatus | undefined;

          if (
            status &&
            status !== EmergencyStatus.COMPLETED &&
            status !== EmergencyStatus.CANCELLED
          ) {
            if (lastRedirectedEmergencyIdRef.current === storedRequestId) {
              isActiveEmergencyCheckInFlight.current = false;
              return;
            }
            lastRedirectedEmergencyIdRef.current = storedRequestId;
            router.replace({
              pathname: '/emergency-tracking',
              params: {
                requestId: storedRequestId,
                // emergency tracking screen defaults safely if missing
                emergencyType: req?.serviceType,
                role: 'user',
              },
            });
            isActiveEmergencyCheckInFlight.current = false;
            return;
          }
        } catch (e) {
          // If validation fails, fall through to server-side lookup.
          console.log('[ActiveEmergency] Stored request validation failed:', e);
        }
      }

      // 2) Ask backend if user has any active request
      // Use /recent (no query schema restrictions) and pick the latest active status.
      try {
        const resp = await api.get(emergencyRequestEndpoints.recent);
        const recent = resp.data?.data;
        const list = Array.isArray(recent) ? recent : [];

        const active = list.find(r => {
          const s = r?.requestStatus;
          return (
            s === 'pending' ||
            s === 'accepted' ||
            s === 'assigned' ||
            s === 'in_progress'
          );
        });

        if (active?.id) {
          if (lastRedirectedEmergencyIdRef.current === active.id) {
            isActiveEmergencyCheckInFlight.current = false;
            return;
          }
          lastRedirectedEmergencyIdRef.current = active.id;
          router.replace({
            pathname: '/emergency-tracking',
            params: {
              requestId: active.id,
              emergencyType: active?.serviceType,
              role: 'user',
            },
          });
          isActiveEmergencyCheckInFlight.current = false;
          return;
        }
      } catch (e) {
        console.log('[ActiveEmergency] Failed to fetch recent requests', e);
      }

      isActiveEmergencyCheckInFlight.current = false;
    };

    // On first run, check if online.
    // If we were offline and just became online, re-check.
    const wasOnline = lastOnlineRef.current;
    lastOnlineRef.current = isConnected;
    console.log('was Online', wasOnline);

    if (wasOnline === null) {
      if (isConnected) maybeRedirectToActiveEmergency();
      return;
    }

    if (wasOnline === false && isConnected === true) {
      maybeRedirectToActiveEmergency();
    }
  }, [user, isCheckingAuth, isLoading, router, isConnected, pathname]);

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
