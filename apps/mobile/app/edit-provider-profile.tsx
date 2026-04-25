import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  UpdateProviderProfileData,
  serviceProviderApi,
} from '@/services/provider/provider.api';
import { uploadApi } from '@/services/upload/upload.api';
import { useProviderStore } from '@/store/providerStore';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const BLACK = '#000000';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  ambulance: 'Ambulance',
  police: 'Police',
  fire_truck: 'Fire Truck',
  rescue_team: 'Rescue Team',
};

export default function EditProviderProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    setProvider,
    provider: storeProvider,
    updateProfilePicture,
  } = useProviderStore();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    primaryAddress: '',
    serviceArea: '',
    vehicleType: '',
    vehicleNumber: '',
    vehicleModel: '',
    vehicleColor: '',
  });

  const [isUploading, setIsUploading] = useState(false);

  const {
    data: profile,
    isLoading,
    refetch,
    isError,
  } = useQuery({
    queryKey: ['providerProfile'],
    queryFn: serviceProviderApi.getProfile,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const currentProfile = profile || storeProvider;
    if (currentProfile) {
      setFormData({
        name: currentProfile.name || '',
        age: currentProfile.age?.toString() || '',
        primaryAddress: currentProfile.primaryAddress || '',
        serviceArea: (currentProfile as any).serviceArea || '',
        vehicleType: currentProfile.vehicleInformation?.type || '',
        vehicleNumber: currentProfile.vehicleInformation?.number || '',
        vehicleModel: currentProfile.vehicleInformation?.model || '',
        vehicleColor: currentProfile.vehicleInformation?.color || '',
      });
    }
  }, [profile, storeProvider]);

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
      ...(profile?.profilePicture || storeProvider?.profilePicture
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
    mutationFn: (data: UpdateProviderProfileData) =>
      serviceProviderApi.updateProfile(data),
    onSuccess: updatedProfile => {
      queryClient.invalidateQueries({ queryKey: ['providerProfile'] });
      if (storeProvider) {
        setProvider({
          ...storeProvider,
          name: updatedProfile.name || storeProvider.name,
          age: updatedProfile.age,
          primaryAddress: updatedProfile.primaryAddress,
          vehicleInformation: updatedProfile.vehicleInformation,
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
    const updateData: UpdateProviderProfileData = {};

    const currentProfile = profile || storeProvider;
    if (formData.name.trim() && formData.name !== currentProfile?.name) {
      updateData.name = formData.name.trim();
    }

    if (formData.age && parseInt(formData.age) !== currentProfile?.age) {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 1 || age > 150) {
        Alert.alert('ERROR', 'Please enter a valid age');
        return;
      }
      updateData.age = age;
    }

    if (
      formData.primaryAddress.trim() &&
      formData.primaryAddress !== currentProfile?.primaryAddress
    ) {
      updateData.primaryAddress = formData.primaryAddress.trim();
    }

    if (
      formData.serviceArea.trim() &&
      formData.serviceArea !== (currentProfile as any)?.serviceArea
    ) {
      updateData.serviceArea = formData.serviceArea.trim();
    }

    const vehicleChanged =
      formData.vehicleType !==
        (currentProfile?.vehicleInformation?.type || '') ||
      formData.vehicleNumber !==
        (currentProfile?.vehicleInformation?.number || '') ||
      formData.vehicleModel !==
        (currentProfile?.vehicleInformation?.model || '') ||
      formData.vehicleColor !==
        (currentProfile?.vehicleInformation?.color || '');

    if (vehicleChanged) {
      updateData.vehicleInformation = {
        type: formData.vehicleType.trim(),
        number: formData.vehicleNumber.trim(),
        model: formData.vehicleModel.trim(),
        color: formData.vehicleColor.trim(),
      };
    }

    if (Object.keys(updateData).length === 0) {
      Alert.alert('NO CHANGES', 'No changes were made to your profile');
      return;
    }

    updateMutation.mutate(updateData);
  };

  const currentProfile = profile || storeProvider;
  const currentProfilePicture =
    profile?.profilePicture || storeProvider?.profilePicture || undefined;
  const currentEmail = currentProfile?.email || '';
  const currentServiceType = currentProfile?.serviceType || '';
  const currentPhoneNumber = currentProfile?.phoneNumber;

  const showLoading = isLoading && !currentProfile;
  const showError = isError && !currentProfile;

  if (showLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SIGNAL_RED} />
          <Text style={styles.loadingText}>LOADING PROFILE...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color={SIGNAL_RED} />
          <Text style={styles.errorText}>FAILED TO LOAD PROFILE</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
            activeOpacity={0.8}
          >
            <Text style={styles.retryButtonText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={OFF_WHITE} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
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
            {currentProfilePicture ? (
              <Image
                source={{ uri: currentProfilePicture }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {formData.name?.charAt(0)?.toUpperCase() || 'P'}
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
          <Text style={styles.emailText}>{currentEmail}</Text>
          {currentServiceType && (
            <View style={styles.serviceBadge}>
              <Text style={styles.serviceBadgeText}>
                {SERVICE_TYPE_LABELS[currentServiceType] || currentServiceType}
              </Text>
            </View>
          )}
          <Text style={styles.tapToChangeText}>TAP TO CHANGE PHOTO</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PERSONAL INFORMATION</Text>
            <View style={styles.sectionLine} />
          </View>
          <View style={styles.formCard}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>FULL NAME</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color={MID_GRAY} />
                <TextInput
                  value={formData.name}
                  onChangeText={text =>
                    setFormData({ ...formData, name: text })
                  }
                  placeholder="Enter your name"
                  placeholderTextColor={MID_GRAY}
                  style={styles.textInput}
                  editable={!updateMutation.isPending}
                />
              </View>
            </View>

            <View style={styles.formFieldBorder}>
              <Text style={styles.formLabel}>AGE</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="calendar-outline" size={18} color={MID_GRAY} />
                <TextInput
                  value={formData.age}
                  onChangeText={text => setFormData({ ...formData, age: text })}
                  placeholder="Enter your age"
                  placeholderTextColor={MID_GRAY}
                  keyboardType="numeric"
                  style={styles.textInput}
                  editable={!updateMutation.isPending}
                />
              </View>
            </View>

            <View style={styles.formFieldBorder}>
              <Text style={styles.formLabel}>PRIMARY ADDRESS</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={18} color={MID_GRAY} />
                <TextInput
                  value={formData.primaryAddress}
                  onChangeText={text =>
                    setFormData({ ...formData, primaryAddress: text })
                  }
                  placeholder="Enter your address"
                  placeholderTextColor={MID_GRAY}
                  style={styles.textInput}
                  editable={!updateMutation.isPending}
                />
              </View>
            </View>

            <View style={styles.formFieldBorder}>
              <Text style={styles.formLabel}>SERVICE AREA</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="map-outline" size={18} color={MID_GRAY} />
                <TextInput
                  value={formData.serviceArea}
                  onChangeText={text =>
                    setFormData({ ...formData, serviceArea: text })
                  }
                  placeholder="Enter your service area"
                  placeholderTextColor={MID_GRAY}
                  style={styles.textInput}
                  editable={!updateMutation.isPending}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>VEHICLE INFORMATION</Text>
            <View style={styles.sectionLine} />
          </View>
          <View style={styles.formCard}>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>VEHICLE TYPE</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="car-outline" size={18} color={MID_GRAY} />
                <TextInput
                  value={formData.vehicleType}
                  onChangeText={text =>
                    setFormData({ ...formData, vehicleType: text })
                  }
                  placeholder="e.g., Ambulance Van"
                  placeholderTextColor={MID_GRAY}
                  style={styles.textInput}
                  editable={!updateMutation.isPending}
                />
              </View>
            </View>

            <View style={styles.formFieldBorder}>
              <Text style={styles.formLabel}>VEHICLE NUMBER</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={MID_GRAY}
                />
                <TextInput
                  value={formData.vehicleNumber}
                  onChangeText={text =>
                    setFormData({ ...formData, vehicleNumber: text })
                  }
                  placeholder="e.g., ABC-1234"
                  placeholderTextColor={MID_GRAY}
                  style={styles.textInput}
                  editable={!updateMutation.isPending}
                />
              </View>
            </View>

            <View style={styles.formFieldBorder}>
              <Text style={styles.formLabel}>VEHICLE MODEL</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="speedometer-outline"
                  size={18}
                  color={MID_GRAY}
                />
                <TextInput
                  value={formData.vehicleModel}
                  onChangeText={text =>
                    setFormData({ ...formData, vehicleModel: text })
                  }
                  placeholder="e.g., Toyota Hiace"
                  placeholderTextColor={MID_GRAY}
                  style={styles.textInput}
                  editable={!updateMutation.isPending}
                />
              </View>
            </View>

            <View style={styles.formFieldBorder}>
              <Text style={styles.formLabel}>VEHICLE COLOR</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="color-palette-outline"
                  size={18}
                  color={MID_GRAY}
                />
                <TextInput
                  value={formData.vehicleColor}
                  onChangeText={text =>
                    setFormData({ ...formData, vehicleColor: text })
                  }
                  placeholder="e.g., White"
                  placeholderTextColor={MID_GRAY}
                  style={styles.textInput}
                  editable={!updateMutation.isPending}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
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
                <Text style={styles.readOnlyValue}>{currentEmail}</Text>
              </View>
            </View>
            <View style={styles.readOnlyItem}>
              <View style={styles.readOnlyIcon}>
                <Ionicons name="call-outline" size={18} color={MID_GRAY} />
              </View>
              <View style={styles.readOnlyContent}>
                <Text style={styles.readOnlyLabel}>
                  PHONE NUMBER (CONTACT ADMIN)
                </Text>
                <Text style={styles.readOnlyValue}>
                  {currentPhoneNumber || 'Not set'}
                </Text>
              </View>
            </View>
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
  errorText: {
    fontSize: 12,
    color: SIGNAL_RED,
    letterSpacing: 2,
    marginTop: 16,
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: SIGNAL_RED,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  backButton: {
    padding: 10,
    backgroundColor: SIGNAL_RED,
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
  },
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
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BLACK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
    color: BLACK,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  serviceBadge: {
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 8,
  },
  serviceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: BLACK,
    letterSpacing: 1,
  },
  tapToChangeText: {
    fontSize: 9,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
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
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
  },
  formField: {
    marginBottom: 16,
  },
  formFieldBorder: {
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
    paddingTop: 16,
    marginTop: 0,
  },
  formLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: BLACK,
    paddingVertical: 12,
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  readOnlyCard: {
    backgroundColor: LIGHT_GRAY,
    padding: 16,
  },
  readOnlyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 12,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 2,
    marginLeft: 8,
  },
});
