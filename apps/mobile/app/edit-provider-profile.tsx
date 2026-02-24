import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ServiceProviderProfile,
  UpdateProviderProfileData,
  serviceProviderApi,
} from '@/services/provider/provider.api';
import { useProviderStore } from '@/store/providerStore';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  ambulance: 'Ambulance',
  police: 'Police',
  fire_truck: 'Fire Truck',
  rescue_team: 'Rescue Team',
};

interface FormField {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  value: string;
  section?: 'profile' | 'vehicle';
}

export default function EditProviderProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setProvider, provider: storeProvider } = useProviderStore();

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

  const { data: profile, isLoading } = useQuery({
    queryKey: ['providerProfile'],
    queryFn: serviceProviderApi.getProfile,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        age: profile.age?.toString() || '',
        primaryAddress: profile.primaryAddress || '',
        serviceArea: profile.serviceArea || '',
        vehicleType: profile.vehicleInformation?.type || '',
        vehicleNumber: profile.vehicleInformation?.number || '',
        vehicleModel: profile.vehicleInformation?.model || '',
        vehicleColor: profile.vehicleInformation?.color || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProviderProfileData) =>
      serviceProviderApi.updateProfile(data),
    onSuccess: updatedProfile => {
      queryClient.invalidateQueries({ queryKey: ['providerProfile'] });
      // Sync with providerStore
      if (storeProvider) {
        setProvider({
          ...storeProvider,
          name: updatedProfile.name || storeProvider.name,
          age: updatedProfile.age,
          primaryAddress: updatedProfile.primaryAddress,
          vehicleInformation: updatedProfile.vehicleInformation,
        });
      }
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to update profile'
      );
    },
  });

  const handleSave = () => {
    const updateData: UpdateProviderProfileData = {};

    if (formData.name.trim() && formData.name !== profile?.name) {
      updateData.name = formData.name.trim();
    }

    if (formData.age && parseInt(formData.age) !== profile?.age) {
      const age = parseInt(formData.age);
      if (isNaN(age) || age < 1 || age > 150) {
        Alert.alert('Error', 'Please enter a valid age');
        return;
      }
      updateData.age = age;
    }

    if (
      formData.primaryAddress.trim() &&
      formData.primaryAddress !== profile?.primaryAddress
    ) {
      updateData.primaryAddress = formData.primaryAddress.trim();
    }

    if (
      formData.serviceArea.trim() &&
      formData.serviceArea !== profile?.serviceArea
    ) {
      updateData.serviceArea = formData.serviceArea.trim();
    }

    // Check if any vehicle information has changed
    const vehicleChanged =
      formData.vehicleType !== (profile?.vehicleInformation?.type || '') ||
      formData.vehicleNumber !== (profile?.vehicleInformation?.number || '') ||
      formData.vehicleModel !== (profile?.vehicleInformation?.model || '') ||
      formData.vehicleColor !== (profile?.vehicleInformation?.color || '');

    if (vehicleChanged) {
      updateData.vehicleInformation = {
        type: formData.vehicleType.trim(),
        number: formData.vehicleNumber.trim(),
        model: formData.vehicleModel.trim(),
        color: formData.vehicleColor.trim(),
      };
    }

    if (Object.keys(updateData).length === 0) {
      Alert.alert('No Changes', 'No changes were made to your profile');
      return;
    }

    updateMutation.mutate(updateData);
  };

  const profileFields: FormField[] = [
    {
      key: 'name',
      label: 'Full Name',
      icon: 'person-outline',
      placeholder: 'Enter your name',
      value: formData.name,
      section: 'profile',
    },
    {
      key: 'age',
      label: 'Age',
      icon: 'calendar-outline',
      placeholder: 'Enter your age',
      keyboardType: 'numeric',
      value: formData.age,
      section: 'profile',
    },
    {
      key: 'primaryAddress',
      label: 'Primary Address',
      icon: 'location-outline',
      placeholder: 'Enter your address',
      value: formData.primaryAddress,
      section: 'profile',
    },
    {
      key: 'serviceArea',
      label: 'Service Area',
      icon: 'map-outline',
      placeholder: 'Enter your service area',
      value: formData.serviceArea,
      section: 'profile',
    },
  ];

  const vehicleFields: FormField[] = [
    {
      key: 'vehicleType',
      label: 'Vehicle Type',
      icon: 'car-outline',
      placeholder: 'e.g., Ambulance Van',
      value: formData.vehicleType,
      section: 'vehicle',
    },
    {
      key: 'vehicleNumber',
      label: 'Vehicle Number',
      icon: 'document-text-outline',
      placeholder: 'e.g., ABC-1234',
      value: formData.vehicleNumber,
      section: 'vehicle',
    },
    {
      key: 'vehicleModel',
      label: 'Vehicle Model',
      icon: 'speedometer-outline',
      placeholder: 'e.g., Toyota Hiace',
      value: formData.vehicleModel,
      section: 'vehicle',
    },
    {
      key: 'vehicleColor',
      label: 'Vehicle Color',
      icon: 'color-palette-outline',
      placeholder: 'e.g., White',
      value: formData.vehicleColor,
      section: 'vehicle',
    },
  ];

  const renderFormField = (
    field: FormField,
    index: number,
    isLast: boolean
  ) => (
    <View
      key={field.key}
      className={`${!isLast ? 'mb-4 pb-4 border-b border-gray-100' : ''}`}
    >
      <Text
        className="text-sm font-medium text-gray-700 mb-2"
        style={{ fontFamily: 'Inter' }}
      >
        {field.label}
      </Text>
      <View className="flex-row items-center bg-gray-50 rounded-xl px-4">
        <Ionicons name={field.icon} size={20} color="#9CA3AF" />
        <TextInput
          value={field.value}
          onChangeText={text => setFormData({ ...formData, [field.key]: text })}
          placeholder={field.placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={field.keyboardType || 'default'}
          className="flex-1 ml-3 py-3 text-gray-800"
          style={{ fontFamily: 'Inter' }}
          editable={!updateMutation.isPending}
        />
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#E13333" />
        <Text className="mt-4 text-gray-600" style={{ fontFamily: 'Inter' }}>
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-primary px-5 py-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text
              className="text-xl text-white"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
            >
              Edit Profile
            </Text>
            <View className="w-6" />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-6"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Avatar Section */}
          <View className="items-center mb-6">
            <View className="h-24 w-24 items-center justify-center rounded-full bg-primary">
              <Text
                className="text-4xl text-white"
                style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
              >
                {formData.name?.charAt(0)?.toUpperCase() || 'P'}
              </Text>
            </View>
            <Text
              className="mt-3 text-lg text-gray-800 font-semibold"
              style={{ fontFamily: 'Inter' }}
            >
              {profile?.email}
            </Text>
            {profile?.serviceType && (
              <View className="mt-2 bg-primary/10 px-3 py-1 rounded-full">
                <Text
                  className="text-sm text-primary font-medium"
                  style={{ fontFamily: 'Inter' }}
                >
                  {SERVICE_TYPE_LABELS[profile.serviceType] ||
                    profile.serviceType}
                </Text>
              </View>
            )}
          </View>

          {/* Personal Information */}
          <Text
            className="text-lg text-gray-800 mb-3"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Personal Information
          </Text>
          <View
            className="bg-white rounded-2xl p-4 shadow-sm mb-6"
            style={{ elevation: 2 }}
          >
            {profileFields.map((field, index) =>
              renderFormField(field, index, index === profileFields.length - 1)
            )}
          </View>

          {/* Vehicle Information */}
          <Text
            className="text-lg text-gray-800 mb-3"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Vehicle Information
          </Text>
          <View
            className="bg-white rounded-2xl p-4 shadow-sm mb-6"
            style={{ elevation: 2 }}
          >
            {vehicleFields.map((field, index) =>
              renderFormField(field, index, index === vehicleFields.length - 1)
            )}
          </View>

          {/* Read-only Fields */}
          <View className="bg-gray-100 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
              <View className="ml-3">
                <Text
                  className="text-xs text-gray-500"
                  style={{ fontFamily: 'Inter' }}
                >
                  Email (cannot be changed)
                </Text>
                <Text
                  className="text-sm text-gray-600"
                  style={{ fontFamily: 'Inter' }}
                >
                  {profile?.email}
                </Text>
              </View>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="call-outline" size={20} color="#9CA3AF" />
              <View className="ml-3">
                <Text
                  className="text-xs text-gray-500"
                  style={{ fontFamily: 'Inter' }}
                >
                  Phone Number (contact admin to change)
                </Text>
                <Text
                  className="text-sm text-gray-600"
                  style={{ fontFamily: 'Inter' }}
                >
                  {profile?.phoneNumber || 'Not set'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View className="px-5 pb-6 pt-3 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={handleSave}
            disabled={updateMutation.isPending}
            className={`rounded-2xl py-4 flex-row items-center justify-center ${
              updateMutation.isPending ? 'bg-gray-300' : 'bg-primary'
            }`}
            activeOpacity={0.8}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text
                  className="ml-2 text-white font-bold text-lg"
                  style={{ fontFamily: 'Inter' }}
                >
                  Save Changes
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
