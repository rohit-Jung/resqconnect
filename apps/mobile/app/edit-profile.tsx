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
  UpdateProfileData,
  UserProfile,
  userApi,
} from '@/services/user/user.api';
import { useAuthStore } from '@/store/authStore';

interface FormField {
  key: keyof UpdateProfileData;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
  value: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser, user: authUser } = useAuthStore();

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

  const { data: profile, isLoading } = useQuery({
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

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => userApi.updateProfile(data),
    onSuccess: updatedProfile => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      // Sync with authStore
      if (authUser) {
        setUser({
          ...authUser,
          name: updatedProfile.name || authUser.name,
          age: updatedProfile.age,
          phoneNumber: updatedProfile.phoneNumber,
          primaryAddress: updatedProfile.primaryAddress,
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
    const updateData: UpdateProfileData = {};

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
      formData.phoneNumber &&
      parseInt(formData.phoneNumber) !== profile?.phoneNumber
    ) {
      const phone = parseInt(formData.phoneNumber);
      if (isNaN(phone) || formData.phoneNumber.length < 10) {
        Alert.alert('Error', 'Please enter a valid phone number');
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
      Alert.alert('No Changes', 'No changes were made to your profile');
      return;
    }

    updateMutation.mutate(updateData);
  };

  const fields: FormField[] = [
    {
      key: 'name',
      label: 'Full Name',
      icon: 'person-outline',
      placeholder: 'Enter your name',
      value: formData.name,
    },
    {
      key: 'age',
      label: 'Age',
      icon: 'calendar-outline',
      placeholder: 'Enter your age',
      keyboardType: 'numeric',
      value: formData.age,
    },
    {
      key: 'phoneNumber',
      label: 'Phone Number',
      icon: 'call-outline',
      placeholder: 'Enter your phone number',
      keyboardType: 'phone-pad',
      value: formData.phoneNumber,
    },
    {
      key: 'primaryAddress',
      label: 'Primary Address',
      icon: 'location-outline',
      placeholder: 'Enter your address',
      value: formData.primaryAddress,
    },
  ];

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
                {formData.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            <Text
              className="mt-3 text-lg text-gray-800 font-semibold"
              style={{ fontFamily: 'Inter' }}
            >
              {profile?.email}
            </Text>
          </View>

          {/* Form Fields */}
          <View
            className="bg-white rounded-2xl p-4 shadow-sm"
            style={{ elevation: 2 }}
          >
            {fields.map((field, index) => (
              <View
                key={field.key}
                className={`${index < fields.length - 1 ? 'mb-4 pb-4 border-b border-gray-100' : ''}`}
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
                    onChangeText={text =>
                      setFormData({ ...formData, [field.key]: text })
                    }
                    placeholder={field.placeholder}
                    placeholderTextColor="#9CA3AF"
                    keyboardType={field.keyboardType || 'default'}
                    className="flex-1 ml-3 py-3 text-gray-800"
                    style={{ fontFamily: 'Inter' }}
                    editable={!updateMutation.isPending}
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Email (Read-only) */}
          <View className="mt-4 bg-gray-100 rounded-2xl p-4">
            <View className="flex-row items-center">
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
