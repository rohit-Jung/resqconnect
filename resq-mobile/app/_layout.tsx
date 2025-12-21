import '../global.css';

import {
  ChauPhilomeneOne_400Regular,
  ChauPhilomeneOne_400Regular_Italic,
} from '@expo-google-fonts/chau-philomene-one';
import {
  Inter_100Thin,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import TanstackQueryClientProvider from '@/providers/react-query.provider';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ChauPhilomeneOne_400Regular,
    ChauPhilomeneOne_400Regular_Italic,
    Inter_100Thin,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
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
