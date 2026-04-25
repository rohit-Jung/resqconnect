import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { uploadApi } from '@/services/upload/upload.api';
import { UpdateProfileData, userApi } from '@/services/user/user.api';
import { useAuthStore } from '@/store/authStore';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, user: authUser, updateProfilePicture } = useAuthStore();

  const [formData, setFormData] = useState<{
    name: string;
    age: string;
    phoneNumber: string;
    primaryAddress: string;
  }>({
    name: '',
    age: '',
    phoneNumber: '',
    primaryAddress: '',
  });

  const [isUploading, setIsUploading] = useState(false);

  const {
    data: profile,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: userApi.getProfile,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        age: profile.age?.toString() || '',
        phoneNumber: profile.phoneNumber?.toString() || '',
        primaryAddress: profile.primaryAddress || '',
      });
    }
  }, [profile]);

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
      ...(profile?.profilePicture
        ? [
            {
              text: 'Remove Photo',
              style: 'destructive' as const,
              onPress: async () => {
                setIsUploading(true);
                try {
                  await uploadApi.deleteProfilePicture();
                  updateProfilePicture(null);
                  await refetch();
                  Alert.alert('Success', 'Profile picture removed');
                } catch (e: any) {
                  Alert.alert(
                    'Error',
                    e?.response?.data?.message ||
                      e?.response?.data?.error ||
                      e?.message ||
                      'Failed to remove profile picture'
                  );
                } finally {
                  setIsUploading(false);
                }
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
          updateProfilePicture(newUrl);
          await refetch();
          Alert.alert('Success', 'Profile picture updated successfully!');
        } catch (e: any) {
          Alert.alert(
            'Upload Failed',
            e?.response?.data?.message ||
              e?.response?.data?.error ||
              e?.message ||
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

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => userApi.updateProfile(data),
    onSuccess: updatedProfile => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      if (authUser) {
        setUser({
          ...authUser,
          name: updatedProfile.name || authUser.name,
          age: updatedProfile.age,
          phoneNumber: updatedProfile.phoneNumber,
          primaryAddress: updatedProfile.primaryAddress,
        });
      }
      Alert.alert('SUCCESS', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        'ERROR',
        error?.response?.data?.message || 'Failed to update profile'
      );
    },
  });

  const handleSave = () => {
    const updateData: UpdateProfileData = {};

    if (formData.name.trim() && formData.name !== profile?.name) {
      updateData.name = formData.name.trim();
    }

    if (formData.age && parseInt(formData.age) !== profile?.age) {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 1 || age > 150) {
        Alert.alert('ERROR', 'Please enter a valid age');
        return;
      }
      updateData.age = age;
    }

    if (
      formData.phoneNumber &&
      parseInt(formData.phoneNumber) !== profile?.phoneNumber
    ) {
      const phone = parseInt(formData.phoneNumber);
      if (isNaN(phone) || formData.phoneNumber.length < 10) {
        Alert.alert('ERROR', 'Please enter a valid phone number');
        return;
      }
      updateData.phoneNumber = phone;
    }

    if (
      formData.primaryAddress.trim() &&
      formData.primaryAddress !== profile?.primaryAddress
    ) {
      updateData.primaryAddress = formData.primaryAddress.trim();
    }

    if (Object.keys(updateData).length === 0) {
      Alert.alert('NO CHANGES', 'No changes were made to your profile');
      return;
    }

    updateMutation.mutate(updateData);
  };

  if (isLoading && !profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SIGNAL_RED} />
        <Text style={styles.loadingText}>LOADING PROFILE...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={OFF_WHITE} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.brandRow}>
              <Text style={styles.brandMark}>RESQ</Text>
              <Text style={styles.brandDot}>.</Text>
            </View>
            <View style={styles.headerLine} />
            <Text style={styles.tagline}>EDIT PROFILE</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={handlePickImage}
              disabled={isUploading}
              style={styles.avatarContainer}
              activeOpacity={0.8}
            >
              {profile?.profilePicture ? (
                <Image
                  source={{ uri: profile.profilePicture }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {formData.name?.charAt(0)?.toUpperCase() || 'U'}
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
            <Text style={styles.emailText}>{profile?.email}</Text>
            <Text style={styles.tapToChangeText}>TAP TO CHANGE PHOTO</Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.formCard}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>FULL NAME</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={20} color={MID_GRAY} />
                  <TextInput
                    value={formData.name}
                    onChangeText={text =>
                      setFormData({ ...formData, name: text })
                    }
                    placeholder="Enter your name"
                    placeholderTextColor={MID_GRAY}
                    style={styles.input}
                    editable={!updateMutation.isPending}
                  />
                </View>
              </View>

              <View style={styles.fieldDivider} />

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>AGE</Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={MID_GRAY}
                  />
                  <TextInput
                    value={formData.age}
                    onChangeText={text =>
                      setFormData({ ...formData, age: text })
                    }
                    placeholder="Enter your age"
                    placeholderTextColor={MID_GRAY}
                    keyboardType="numeric"
                    style={styles.input}
                    editable={!updateMutation.isPending}
                  />
                </View>
              </View>

              <View style={styles.fieldDivider} />

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="call-outline" size={20} color={MID_GRAY} />
                  <TextInput
                    value={formData.phoneNumber}
                    onChangeText={text =>
                      setFormData({ ...formData, phoneNumber: text })
                    }
                    placeholder="Enter your phone number"
                    placeholderTextColor={MID_GRAY}
                    keyboardType="phone-pad"
                    style={styles.input}
                    editable={!updateMutation.isPending}
                  />
                </View>
              </View>

              <View style={styles.fieldDivider} />

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PRIMARY ADDRESS</Text>
                <View style={styles.inputRow}>
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color={MID_GRAY}
                  />
                  <TextInput
                    value={formData.primaryAddress}
                    onChangeText={text =>
                      setFormData({ ...formData, primaryAddress: text })
                    }
                    placeholder="Enter your address"
                    placeholderTextColor={MID_GRAY}
                    style={styles.input}
                    editable={!updateMutation.isPending}
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.emailSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ACCOUNT DETAILS</Text>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.readOnlyCard}>
              <View style={styles.readOnlyItem}>
                <View style={styles.readOnlyIcon}>
                  <Ionicons name="mail-outline" size={18} color={MID_GRAY} />
                </View>
                <View style={styles.readOnlyContent}>
                  <Text style={styles.readOnlyLabel}>
                    EMAIL (CANNOT BE CHANGED)
                  </Text>
                  <Text style={styles.readOnlyValue}>{profile?.email}</Text>
                </View>
              </View>
              {profile?.phoneNumber && !formData.phoneNumber && (
                <View style={styles.readOnlyItem}>
                  <View style={styles.readOnlyIcon}>
                    <Ionicons name="call-outline" size={18} color={MID_GRAY} />
                  </View>
                  <View style={styles.readOnlyContent}>
                    <Text style={styles.readOnlyLabel}>
                      PHONE (CONTACT ADMIN)
                    </Text>
                    <Text style={styles.readOnlyValue}>
                      {profile.phoneNumber}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={updateMutation.isPending}
            style={[
              styles.saveButton,
              updateMutation.isPending && styles.saveButtonDisabled,
            ]}
            activeOpacity={0.8}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color={OFF_WHITE} />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color={OFF_WHITE} />
                <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: OFF_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 2,
    marginTop: 16,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  backButton: {
    padding: 10,
    marginRight: 16,
    backgroundColor: SIGNAL_RED,
  },
  headerContent: {},
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 22,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 22,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 26,
  },
  headerLine: {
    width: 30,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 4,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: OFF_WHITE,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SIGNAL_RED,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: OFF_WHITE,
  },
  emailText: {
    fontSize: 14,
    fontWeight: '500',
    color: BLACK,
    marginBottom: 8,
  },
  tapToChangeText: {
    fontSize: 9,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  formSection: {
    paddingHorizontal: 24,
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
  formCard: {
    backgroundColor: OFF_WHITE,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    padding: 16,
  },
  field: {
    paddingVertical: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
    marginBottom: 8,
  },
  fieldDivider: {
    height: 1,
    backgroundColor: LIGHT_GRAY,
    marginVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: BLACK,
    marginLeft: 12,
    padding: 0,
  },
  emailSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  readOnlyCard: {
    backgroundColor: LIGHT_GRAY,
    padding: 16,
  },
  readOnlyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  readOnlyIcon: {
    width: 36,
    height: 36,
    backgroundColor: OFF_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  readOnlyContent: {
    flex: 1,
  },
  readOnlyLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
    marginBottom: 4,
  },
  readOnlyValue: {
    fontSize: 12,
    color: BLACK,
    letterSpacing: 0.5,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    paddingVertical: 16,
  },
  saveButtonDisabled: {
    backgroundColor: MID_GRAY,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 2,
    marginLeft: 8,
  },
});
