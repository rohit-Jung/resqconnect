import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
export { ErrorBoundary } from 'expo-router';
import '../global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
