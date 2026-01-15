import SafeAreaContainer from '@/components/SafeAreaContainer';
import { useAuthStore } from '@/store/authStore';
import { Redirect, useRouter } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  return (
    <SafeAreaContainer>
      <ScrollView className="flex-1 bg-white">
        {/* Header */}
        <View className="items-center bg-primary px-6 pb-8 pt-4">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-white/20">
            <Text
              className="text-4xl text-white"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text
            className="text-2xl text-white"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
            {user?.name || 'User'}
          </Text>
          <Text className="mt-1 text-sm text-white/80" style={{ fontFamily: 'Inter' }}>
            {user?.email || 'email@example.com'}
          </Text>
          {user?.role && (
            <View className="mt-3 rounded-full bg-white/20 px-4 py-1">
              <Text className="text-xs font-medium text-white" style={{ fontFamily: 'Inter' }}>
                {user.role.toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Profile Info Section */}
        <View className="px-6 pt-6">
          <Text
            className="mb-4 text-lg text-gray-800"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
            Profile Information
          </Text>

          <ProfileInfoCard icon="person-outline" label="Username" value={user?.username || 'N/A'} />
          <ProfileInfoCard icon="mail-outline" label="Email" value={user?.email || 'N/A'} />
          <ProfileInfoCard
            icon="call-outline"
            label="Phone Number"
            value={user?.phoneNumber?.toString() || 'Not set'}
          />
          <ProfileInfoCard
            icon="calendar-outline"
            label="Age"
            value={user?.age?.toString() || 'Not set'}
          />
          <ProfileInfoCard
            icon="location-outline"
            label="Primary Address"
            value={user?.primaryAddress || 'Not set'}
          />
        </View>

        {/* Settings Section */}
        <View className="mt-6 px-6">
          <Text
            className="mb-4 text-lg text-gray-800"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
            Settings
          </Text>

          <SettingsMenuItem
            icon="lock-closed-outline"
            title="Change Password"
            onPress={() => router.push('/(auth)/change-password')}
          />
          <SettingsMenuItem
            icon="notifications-outline"
            title="Notifications"
            onPress={() =>
              Alert.alert('Coming Soon', 'Notification settings will be available soon.')
            }
          />
          <SettingsMenuItem
            icon="shield-outline"
            title="Privacy & Security"
            onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon.')}
          />
          <SettingsMenuItem
            icon="help-circle-outline"
            title="Help & Support"
            onPress={() => Alert.alert('Coming Soon', 'Help & Support will be available soon.')}
          />
        </View>

        {/* Logout Button */}
        <View className="px-6 pb-8 pt-6">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center rounded-2xl bg-red-50 py-4">
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text
              className="ml-2 text-base font-semibold text-red-500"
              style={{ fontFamily: 'Inter' }}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="items-center pb-8">
          <Text className="text-xs text-gray-400" style={{ fontFamily: 'Inter' }}>
            ResQ Connect v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
}

// Profile Info Card Component
interface ProfileInfoCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({ icon, label, value }) => {
  return (
    <View className="mb-3 flex-row items-center rounded-2xl bg-gray-50 p-4">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Ionicons name={icon} size={20} color="#E13333" />
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-xs text-gray-500" style={{ fontFamily: 'Inter' }}>
          {label}
        </Text>
        <Text className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>
          {value}
        </Text>
      </View>
    </View>
  );
};

// Settings Menu Item Component
interface SettingsMenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}

const SettingsMenuItem: React.FC<SettingsMenuItemProps> = ({ icon, title, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-3 flex-row items-center justify-between rounded-2xl bg-gray-50 p-4"
      activeOpacity={0.7}>
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name={icon} size={20} color="#374151" />
        </View>
        <Text className="ml-4 text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>
          {title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};
