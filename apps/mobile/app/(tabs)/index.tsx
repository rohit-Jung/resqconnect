import { Ionicons } from '@expo/vector-icons';

import { Redirect, useRouter } from 'expo-router';
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { QuickActionCard } from '@/components/QuickActionCard';
import SafeAreaContainer from '@/components/SafeAreaContainer';
import { EMERGENCY_PHONE_NUMBER } from '@/constants';
import { useAuthStore } from '@/store/authStore';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      `This will dial the emergency number (${EMERGENCY_PHONE_NUMBER}). Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => {
            Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`);
          },
        },
      ]
    );
  };

  const handleShareLocation = () => {
    router.push('/share-location');
  };

  const handleContacts = () => {
    router.push('/(tabs)/emergency-contacts');
  };

  const handleFirstAid = () => {
    router.push('/first-aid');
  };

  return (
    <SafeAreaContainer>
      <ScrollView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between bg-primary px-6 pb-6 pt-4">
          <View className="flex-row items-center gap-3">
            <View>
              <Text
                className="text-sm text-white/80"
                style={{ fontFamily: 'Inter' }}
              >
                Welcome back,
              </Text>
              <Text
                className="text-xl text-white"
                style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
              >
                {user?.name || 'User'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={logout}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
          >
            <Ionicons name="log-out-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>

        <View className="items-center px-6 py-8">
          <TouchableOpacity
            className="h-40 w-40 items-center justify-center rounded-full bg-primary shadow-lg"
            activeOpacity={0.8}
            onPress={() => router.push('/emergency-request')}
          >
            <Ionicons name="warning" size={48} color="white" />
            <Text
              className="mt-2 text-2xl text-white"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
            >
              SOS
            </Text>
          </TouchableOpacity>
          <Text
            className="mt-4 text-center text-sm text-gray-500"
            style={{ fontFamily: 'Inter' }}
          >
            Press for emergency assistance
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="px-6">
          <Text
            className="mb-4 text-lg text-gray-800"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Quick Actions
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <QuickActionCard
              icon="call-outline"
              title="Emergency Call"
              color="#E13333"
              onPress={handleEmergencyCall}
            />
            <QuickActionCard
              icon="location-outline"
              title="Share Location"
              color="#3B82F6"
              onPress={handleShareLocation}
            />
            <QuickActionCard
              icon="people-outline"
              title="Contacts"
              color="#10B981"
              onPress={handleContacts}
            />
            <QuickActionCard
              icon="medkit-outline"
              title="First Aid"
              color="#F59E0B"
              onPress={handleFirstAid}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <View className="mt-8 px-6 pb-8">
          <Text
            className="mb-4 text-lg text-gray-800"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
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
                  style={{ fontFamily: 'Inter' }}
                >
                  All Clear
                </Text>
                <Text
                  className="text-sm text-green-600"
                  style={{ fontFamily: 'Inter' }}
                >
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
