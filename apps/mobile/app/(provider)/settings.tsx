import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import SafeAreaContainer from '@/components/SafeAreaContainer';
import { APP_NAME, APP_VERSION } from '@/constants';
import { useProviderStore } from '@/store/providerStore';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  iconBgColor?: string;
  iconColor?: string;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  iconBgColor = '#F3F4F6',
  iconColor = '#6B7280',
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    className="flex-row items-center justify-between rounded-xl bg-gray-50 p-4 mb-3"
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View className="flex-row items-center flex-1">
      <View
        className="h-10 w-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: iconBgColor }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text
          className="text-gray-800 font-medium"
          style={{ fontFamily: 'Inter' }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            className="text-gray-500 text-sm mt-0.5"
            style={{ fontFamily: 'Inter' }}
          >
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    {showChevron && onPress && (
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    )}
  </TouchableOpacity>
);

export default function ProviderSettingsScreen() {
  const router = useRouter();
  const { provider, logout } = useProviderStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/provider-sign-in');
        },
      },
    ]);
  };

  const handleChangePassword = () => {
    router.push('/(auth)/provider-change-password');
  };

  return (
    <SafeAreaContainer>
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-primary px-6 pb-4 pt-2">
          <Text
            className="text-2xl text-white"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Settings
          </Text>
          <Text
            className="text-sm text-white/80 mt-1"
            style={{ fontFamily: 'Inter' }}
          >
            Manage your preferences
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Account Section */}
          <View
            className="mb-6 rounded-2xl bg-white p-4 shadow-sm"
            style={{ elevation: 2 }}
          >
            <Text
              className="mb-4 text-lg text-gray-800"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
            >
              Account
            </Text>

            <SettingsItem
              icon="person-outline"
              title="Profile"
              subtitle={provider?.name || 'View and edit your profile'}
              onPress={() => router.push('/(provider)/profile')}
              iconBgColor="#FEE2E2"
              iconColor="#E13333"
            />

            <SettingsItem
              icon="lock-closed-outline"
              title="Change Password"
              subtitle="Update your password"
              onPress={handleChangePassword}
              iconBgColor="#DBEAFE"
              iconColor="#3B82F6"
            />
          </View>

          {/* Notifications Section */}
          <View
            className="mb-6 rounded-2xl bg-white p-4 shadow-sm"
            style={{ elevation: 2 }}
          >
            <Text
              className="mb-4 text-lg text-gray-800"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
            >
              Notifications
            </Text>

            <SettingsItem
              icon="notifications-outline"
              title="Notification Settings"
              subtitle="Configure how you receive alerts"
              onPress={() => router.push('/notification-settings')}
              iconBgColor="#FEF3C7"
              iconColor="#F59E0B"
            />
          </View>

          {/* Help & Support Section */}
          <View
            className="mb-6 rounded-2xl bg-white p-4 shadow-sm"
            style={{ elevation: 2 }}
          >
            <Text
              className="mb-4 text-lg text-gray-800"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
            >
              Help & Support
            </Text>

            <SettingsItem
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Get help with the app"
              onPress={() => router.push('/help-support')}
              iconBgColor="#D1FAE5"
              iconColor="#10B981"
            />
          </View>

          {/* About Section */}
          <View
            className="mb-6 rounded-2xl bg-white p-4 shadow-sm"
            style={{ elevation: 2 }}
          >
            <Text
              className="mb-4 text-lg text-gray-800"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
            >
              About
            </Text>

            <SettingsItem
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => router.push('/terms-of-service')}
              iconBgColor="#F3F4F6"
              iconColor="#6B7280"
            />

            <SettingsItem
              icon="shield-outline"
              title="Privacy Policy"
              onPress={() => router.push('/privacy-policy')}
              iconBgColor="#F3F4F6"
              iconColor="#6B7280"
            />

            <View className="items-center pt-4 pb-2">
              <Text
                className="text-gray-800 font-medium"
                style={{ fontFamily: 'Inter' }}
              >
                {APP_NAME}
              </Text>
              <Text
                className="text-sm text-gray-400 mt-1"
                style={{ fontFamily: 'Inter' }}
              >
                Version {APP_VERSION}
              </Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="mb-8 flex-row items-center justify-center rounded-2xl bg-red-50 py-4"
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text
              className="ml-2 text-base font-semibold text-red-500"
              style={{ fontFamily: 'Inter' }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaContainer>
  );
}
