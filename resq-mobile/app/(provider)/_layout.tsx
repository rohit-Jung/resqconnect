import { Stack } from 'expo-router';

const ProviderLayout: React.FC = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen
        name="dashboard"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
};

export default ProviderLayout;
