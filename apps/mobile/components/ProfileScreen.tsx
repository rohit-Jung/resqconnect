import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

import SafeAreaContainer from '@/components/SafeAreaContainer';

// Profile Info Card Component
interface ProfileInfoCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({
  icon,
  label,
  value,
}) => {
  return (
    <View className="mb-3 flex-row items-center rounded-2xl bg-gray-50 p-4">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Ionicons name={icon} size={20} color="#E13333" />
      </View>
      <View className="ml-4 flex-1">
        <Text className="text-xs text-gray-500" style={{ fontFamily: 'Inter' }}>
          {label}
        </Text>
        <Text
          className="text-sm font-medium text-gray-800"
          style={{ fontFamily: 'Inter' }}
        >
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

export const SettingsMenuItem: React.FC<SettingsMenuItemProps> = ({
  icon,
  title,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-3 flex-row items-center justify-between rounded-2xl bg-gray-50 p-4"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
          <Ionicons name={icon} size={20} color="#374151" />
        </View>
        <Text
          className="ml-4 text-sm font-medium text-gray-800"
          style={{ fontFamily: 'Inter' }}
        >
          {title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

// Profile Header Props
interface ProfileHeaderProps {
  name: string;
  email: string;
  role?: string;
  avatarLetter?: string;
  onEditPress?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  email,
  role,
  avatarLetter,
  onEditPress,
}) => {
  return (
    <View className="items-center bg-primary px-6 pb-8 pt-4">
      <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-white/20">
        <Text
          className="text-4xl text-white"
          style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
        >
          {avatarLetter || name?.charAt(0)?.toUpperCase() || 'U'}
        </Text>
      </View>
      <Text
        className="text-2xl text-white"
        style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
      >
        {name || 'User'}
      </Text>
      <Text
        className="mt-1 text-sm text-white/80"
        style={{ fontFamily: 'Inter' }}
      >
        {email || 'email@example.com'}
      </Text>
      {role && (
        <View className="mt-3 rounded-full bg-white/20 px-4 py-1">
          <Text
            className="text-xs font-medium text-white"
            style={{ fontFamily: 'Inter' }}
          >
            {role.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      )}
      {onEditPress && (
        <TouchableOpacity
          onPress={onEditPress}
          className="mt-4 flex-row items-center rounded-full bg-white/20 px-4 py-2"
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={16} color="#fff" />
          <Text
            className="ml-2 text-sm font-medium text-white"
            style={{ fontFamily: 'Inter' }}
          >
            Edit Profile
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Profile Info Item definition
export interface ProfileInfoItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

// Settings Item definition
export interface SettingsItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}

// Main Profile Screen Props
interface ProfileScreenContentProps {
  name: string;
  email: string;
  role?: string;
  avatarLetter?: string;
  profileInfoItems: ProfileInfoItem[];
  settingsItems?: SettingsItem[];
  additionalSections?: React.ReactNode;
  onLogout: () => Promise<void>;
  changePasswordRoute?: string;
  editProfileRoute?: string;
  version?: string;
}

export const ProfileScreenContent: React.FC<ProfileScreenContentProps> = ({
  name,
  email,
  role,
  avatarLetter,
  profileInfoItems,
  settingsItems,
  additionalSections,
  onLogout,
  changePasswordRoute = '/(auth)/change-password',
  editProfileRoute = '/edit-profile',
  version = 'v1.0.0',
}) => {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await onLogout();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    router.push(editProfileRoute as any);
  };

  const defaultSettingsItems: SettingsItem[] = [
    {
      icon: 'lock-closed-outline',
      title: 'Change Password',
      onPress: () => router.push(changePasswordRoute as any),
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      onPress: () => router.push('/notification-settings' as any),
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      onPress: () => router.push('/help-support' as any),
    },
    {
      icon: 'document-text-outline',
      title: 'Terms of Service',
      onPress: () => router.push('/terms-of-service' as any),
    },
    {
      icon: 'shield-outline',
      title: 'Privacy Policy',
      onPress: () => router.push('/privacy-policy' as any),
    },
  ];

  const finalSettingsItems = settingsItems ?? defaultSettingsItems;

  return (
    <SafeAreaContainer>
      <ScrollView className="flex-1 bg-white">
        {/* Header */}
        <ProfileHeader
          name={name}
          email={email}
          role={role}
          avatarLetter={avatarLetter}
          onEditPress={handleEditProfile}
        />

        {/* Profile Info Section */}
        <View className="px-6 pt-6">
          <Text
            className="mb-4 text-lg text-gray-800"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Profile Information
          </Text>

          {profileInfoItems.map((item, index) => (
            <ProfileInfoCard
              key={`profile-${index}`}
              icon={item.icon}
              label={item.label}
              value={item.value}
            />
          ))}
        </View>

        {/* Additional Sections (for provider-specific content) */}
        {additionalSections}

        {/* Settings Section */}
        <View className="mt-6 px-6">
          <Text
            className="mb-4 text-lg text-gray-800"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Settings
          </Text>

          {finalSettingsItems.map((item, index) => (
            <SettingsMenuItem
              key={`settings-${index}`}
              icon={item.icon}
              title={item.title}
              onPress={item.onPress}
            />
          ))}
        </View>

        {/* Logout Button */}
        <View className="px-6 pb-8 pt-6">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center justify-center rounded-2xl bg-red-50 py-4"
          >
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
            <Text
              className="ml-2 text-base font-semibold text-red-500"
              style={{ fontFamily: 'Inter' }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View className="items-center pb-8">
          <Text
            className="text-xs text-gray-400"
            style={{ fontFamily: 'Inter' }}
          >
            ResQ Connect {version}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaContainer>
  );
};

export default ProfileScreenContent;
