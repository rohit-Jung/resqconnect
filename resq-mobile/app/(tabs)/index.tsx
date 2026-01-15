import SafeAreaContainer from '@/components/SafeAreaContainer';
import { useAuthStore } from '@/store/authStore';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { QuickActionCard } from '@/components/QuickActionCard';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <SafeAreaContainer>
      <ScrollView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between bg-primary px-6 pb-6 pt-4">
          <View className="flex-row items-center gap-3">
            {/* <View className="h-12 w-12 overflow-hidden rounded-full bg-white p-2">
              <Image
                source={require('../../assets/resq-connect-logo.png')}
                resizeMode="center"
                className="h-full w-full"
              />
            </View> */}
            <View>
              <Text
                className="text-sm text-white/80"
                style={{ fontFamily: 'Inter' }}>
                Welcome back,
              </Text>
              <Text
                className="text-xl text-white"
                style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
                {user?.name || 'User'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={logout}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <Ionicons name="log-out-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>

        <View className="items-center px-6 py-8">
          <TouchableOpacity
            className="h-40 w-40 items-center justify-center rounded-full bg-primary shadow-lg"
            activeOpacity={0.8}
            onPress={() => router.push('/emergency-request')}>
            <Ionicons name="warning" size={48} color="white" />
            <Text
              className="mt-2 text-2xl text-white"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
              SOS
            </Text>
          </TouchableOpacity>
          <Text
            className="mt-4 text-center text-sm text-gray-500"
            style={{ fontFamily: 'Inter' }}>
            Press for emergency assistance
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="px-6">
          <Text
            className="mb-4 text-lg text-gray-800"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <QuickActionCard
              icon="call-outline"
              title="Emergency Call"
              color="#E13333"
            />
            <QuickActionCard
              icon="location-outline"
              title="Share Location"
              color="#3B82F6"
            />
            <QuickActionCard
              icon="people-outline"
              title="Contacts"
              color="#10B981"
            />
            <QuickActionCard
              icon="medkit-outline"
              title="First Aid"
              color="#F59E0B"
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View className="mt-8 px-6 pb-8">
          <Text
            className="mb-4 text-lg text-gray-800"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
            Safety Status
          </Text>
          <View className="rounded-2xl bg-green-50 p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-green-500">
                <Ionicons name="shield-checkmark" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text
                  className="font-medium text-green-800"
                  style={{ fontFamily: 'Inter' }}>
                  All Clear
                </Text>
                <Text
                  className="text-sm text-green-600"
                  style={{ fontFamily: 'Inter' }}>
                  No active emergencies in your area
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
}
