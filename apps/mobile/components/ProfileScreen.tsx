import { Ionicons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import SafeAreaContainer from '@/components/SafeAreaContainer';
import { uploadApi } from '@/services/upload/upload.api';

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
  profilePicture?: string | null;
  onEditPress?: () => void;
  onProfilePictureChange?: (newUrl: string | null) => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  email,
  role,
  avatarLetter,
  profilePicture,
  onEditPress,
  onProfilePictureChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async () => {
    // Request permission
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload a profile picture.'
      );
      return;
    }

    // Show options: Camera or Gallery
    Alert.alert('Change Profile Picture', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: () => pickImage('camera'),
      },
      {
        text: 'Choose from Gallery',
        onPress: () => pickImage('gallery'),
      },
      ...(profilePicture
        ? [
            {
              text: 'Remove Photo',
              style: 'destructive' as const,
              onPress: handleRemovePhoto,
            },
          ]
        : []),
      {
        text: 'Cancel',
        style: 'cancel' as const,
      },
    ]);
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    try {
      let result;

      if (source === 'camera') {
        const cameraPermission =
          await ImagePicker.requestCameraPermissionsAsync();
        if (!cameraPermission.granted) {
          Alert.alert(
            'Permission Required',
            'Please allow access to your camera to take a profile picture.'
          );
          return;
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const uploadImage = async (imageUri: string) => {
    setIsUploading(true);
    try {
      const newUrl = await uploadApi.uploadProfilePicture(imageUri);
      onProfilePictureChange?.(newUrl);
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(
        'Upload Failed',
        'Failed to upload profile picture. Please try again.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsUploading(true);
            try {
              await uploadApi.deleteProfilePicture();
              onProfilePictureChange?.(null);
              Alert.alert('Success', 'Profile picture removed.');
            } catch (error) {
              console.error('Error removing image:', error);
              Alert.alert('Error', 'Failed to remove profile picture.');
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View className="items-center bg-primary px-6 pb-8 pt-4">
      <TouchableOpacity
        onPress={handlePickImage}
        disabled={isUploading}
        className="relative mb-4"
        activeOpacity={0.8}
      >
        {profilePicture ? (
          <Image
            source={{ uri: profilePicture }}
            className="h-24 w-24 rounded-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-24 w-24 items-center justify-center rounded-full bg-white/20">
            <Text
              className="text-4xl text-white"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
            >
              {avatarLetter || name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}

        {/* Camera icon overlay */}
        <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
          {isUploading ? (
            <ActivityIndicator size="small" color="#E13333" />
          ) : (
            <Ionicons name="camera" size={16} color="#E13333" />
          )}
        </View>
      </TouchableOpacity>

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
  profilePicture?: string | null;
  profileInfoItems: ProfileInfoItem[];
  settingsItems?: SettingsItem[];
  additionalSections?: React.ReactNode;
  onLogout: () => Promise<void>;
  onProfilePictureChange?: (newUrl: string | null) => void;
  changePasswordRoute?: string;
  editProfileRoute?: string;
  version?: string;
}

export const ProfileScreenContent: React.FC<ProfileScreenContentProps> = ({
  name,
  email,
  role,
  avatarLetter,
  profilePicture,
  profileInfoItems,
  settingsItems,
  additionalSections,
  onLogout,
  onProfilePictureChange,
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
          profilePicture={profilePicture}
          onEditPress={handleEditProfile}
          onProfilePictureChange={onProfilePictureChange}
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
