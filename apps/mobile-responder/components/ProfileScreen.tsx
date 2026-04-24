import { Ionicons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import SafeAreaContainer from '@/components/SafeAreaContainer';
import { uploadApi } from '@/services/upload/upload.api';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const BLACK = '#000000';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';

interface ProfileInfoCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({
  icon,
  label,
  value,
}) => (
  <View style={styles.infoCard}>
    <View style={styles.infoIcon}>
      <Ionicons name={icon} size={18} color={SIGNAL_RED} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

interface SettingsMenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}

export const SettingsMenuItem: React.FC<SettingsMenuItemProps> = ({
  icon,
  title,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.menuItem}
    activeOpacity={0.7}
  >
    <View style={styles.menuItemLeft}>
      <View style={styles.menuItemIcon}>
        <Ionicons name={icon} size={18} color={BLACK} />
      </View>
      <Text style={styles.menuItemTitle}>{title.toUpperCase()}</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color={MID_GRAY} />
  </TouchableOpacity>
);

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
  profilePicture,
  onEditPress,
  onProfilePictureChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to upload a profile picture.'
      );
      return;
    }

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
              onPress: () => {
                setIsUploading(true);
                uploadApi
                  .deleteProfilePicture()
                  .then(() => onProfilePictureChange?.(null))
                  .catch(() => {})
                  .finally(() => setIsUploading(false));
              },
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
        setIsUploading(true);
        try {
          const newUrl = await uploadApi.uploadProfilePicture(
            result.assets[0].uri
          );
          onProfilePictureChange?.(newUrl);
          Alert.alert('Success', 'Profile picture updated successfully!');
        } catch {
          Alert.alert(
            'Upload Failed',
            'Failed to upload profile picture. Please try again.'
          );
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.brandRow}>
          <Text style={styles.brandMark}>RESQ</Text>
          <Text style={styles.brandDot}>.</Text>
        </View>
        <View style={styles.headerLine} />
        <Text style={styles.tagline}>YOUR PROFILE</Text>
      </View>
      <TouchableOpacity
        onPress={handlePickImage}
        disabled={isUploading}
        style={styles.avatarContainer}
        activeOpacity={0.8}
      >
        {profilePicture ? (
          <Image
            source={{ uri: profilePicture }}
            style={styles.avatar}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>
              {name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}

        <View style={styles.cameraOverlay}>
          {isUploading ? (
            <ActivityIndicator size="small" color={OFF_WHITE} />
          ) : (
            <Ionicons name="camera" size={14} color={OFF_WHITE} />
          )}
        </View>
      </TouchableOpacity>

      <Text style={styles.headerName}>{name || 'User'}</Text>
      <Text style={styles.headerEmail}>{email || 'email@example.com'}</Text>
      {role && (
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {role.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      )}
      {onEditPress && (
        <TouchableOpacity
          onPress={onEditPress}
          style={styles.editButton}
          activeOpacity={0.7}
        >
          <Ionicons name="pencil-outline" size={14} color={OFF_WHITE} />
          <Text style={styles.editButtonText}>EDIT PROFILE</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export interface ProfileInfoItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

export interface SettingsItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress: () => void;
}

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
  profilePicture,
  profileInfoItems,
  settingsItems,
  additionalSections,
  onLogout,
  onProfilePictureChange,
  // mobile-responder app does not include the user change-password screen.
  changePasswordRoute = '/(auth)/provider-change-password',
  editProfileRoute = '/edit-profile',
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
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          name={name}
          email={email}
          role={role}
          profilePicture={profilePicture}
          onEditPress={handleEditProfile}
          onProfilePictureChange={onProfilePictureChange}
        />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PROFILE INFORMATION</Text>
            <View style={styles.sectionLine} />
          </View>

          {profileInfoItems.map((item, index) => (
            <ProfileInfoCard
              key={`profile-${index}`}
              icon={item.icon}
              label={item.label}
              value={item.value}
            />
          ))}
        </View>

        {additionalSections}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SETTINGS</Text>
            <View style={styles.sectionLine} />
          </View>

          {finalSettingsItems.map((item, index) => (
            <SettingsMenuItem
              key={`settings-${index}`}
              icon={item.icon}
              title={item.title}
              onPress={item.onPress}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={18} color={SIGNAL_RED} />
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>RESQ CONNECT</Text>
          <Text style={styles.versionDot}>·</Text>
          <Text style={styles.versionText}>VERSION 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: OFF_WHITE,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  headerContent: {
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 28,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 28,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 34,
  },
  headerLine: {
    width: 48,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 8,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
    alignSelf: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 36,
    fontWeight: '700',
    color: OFF_WHITE,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    backgroundColor: SIGNAL_RED,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  headerName: {
    fontSize: 20,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 1,
    marginBottom: 4,
    textAlign: 'center',
  },
  headerEmail: {
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: SIGNAL_RED,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
    alignSelf: 'center',
  },
  roleText: {
    fontSize: 9,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLACK,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  editButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: OFF_WHITE,
    letterSpacing: 1,
    marginLeft: 6,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: LIGHT_GRAY,
    marginLeft: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    padding: 16,
    marginBottom: 8,
  },
  infoIcon: {
    width: 36,
    height: 36,
    backgroundColor: LIGHT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: BLACK,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    backgroundColor: LIGHT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: BLACK,
    letterSpacing: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginTop: 32,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: SIGNAL_RED,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: SIGNAL_RED,
    letterSpacing: 2,
    marginLeft: 8,
  },
  versionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  versionText: {
    fontSize: 9,
    color: MID_GRAY,
    letterSpacing: 2,
  },
  versionDot: {
    fontSize: 9,
    color: SIGNAL_RED,
    marginHorizontal: 8,
  },
});

export default ProfileScreenContent;
