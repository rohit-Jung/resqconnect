import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import SafeAreaContainer from '@/components/SafeAreaContainer';
import { APP_NAME, APP_VERSION, SMS_FALLBACK_NUMBER } from '@/constants';
import { EmergencySettings, userApi } from '@/services/user/user.api';
import { useAuthStore } from '@/store/authStore';

const NOTIFICATION_METHODS = [
  { value: 'sms', label: 'SMS Only', icon: 'chatbubble-outline' as const },
  {
    value: 'push',
    label: 'App Notification',
    icon: 'notifications-outline' as const,
  },
  { value: 'both', label: 'Both', icon: 'apps-outline' as const },
];

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  const [localSettings, setLocalSettings] = useState<EmergencySettings>({
    notifyEmergencyContacts: true,
    emergencyNotificationMethod: 'both',
  });

  // Fetch emergency settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['emergencySettings'],
    queryFn: userApi.getEmergencySettings,
  });

  // Update local state when settings are fetched
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<EmergencySettings>) =>
      userApi.updateEmergencySettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencySettings'] });
      Alert.alert('Success', 'Settings updated successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to update settings'
      );
      // Revert local state
      if (settings) {
        setLocalSettings(settings);
      }
    },
  });

  const handleToggleNotify = () => {
    const newValue = !localSettings.notifyEmergencyContacts;
    setLocalSettings({ ...localSettings, notifyEmergencyContacts: newValue });
    updateMutation.mutate({ notifyEmergencyContacts: newValue });
  };

  const handleMethodChange = (method: 'sms' | 'push' | 'both') => {
    setLocalSettings({ ...localSettings, emergencyNotificationMethod: method });
    updateMutation.mutate({ emergencyNotificationMethod: method });
  };

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
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center bg-primary px-6 pb-4 pt-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text
            className="text-2xl text-white"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Settings
          </Text>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Emergency Notifications Section */}
          <View
            className="mb-6 rounded-2xl bg-white p-4 shadow-sm"
            style={{ elevation: 2 }}
          >
            <View className="mb-4 flex-row items-center">
              <View className="mr-3 rounded-full bg-red-100 p-2">
                <Ionicons name="warning-outline" size={20} color="#E63946" />
              </View>
              <Text
                className="text-lg text-gray-800"
                style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
              >
                Emergency Notifications
              </Text>
            </View>

            {isLoading ? (
              <ActivityIndicator size="small" color="#E63946" />
            ) : (
              <>
                {/* Toggle Emergency Contact Notification */}
                <View className="mb-4 flex-row items-center justify-between border-b border-gray-100 pb-4">
                  <View className="flex-1">
                    <Text
                      className="text-base font-medium text-gray-800"
                      style={{ fontFamily: 'Inter' }}
                    >
                      Notify Emergency Contacts
                    </Text>
                    <Text
                      className="mt-1 text-sm text-gray-500"
                      style={{ fontFamily: 'Inter' }}
                    >
                      Alert your emergency contacts when you request help
                    </Text>
                  </View>
                  <Switch
                    value={localSettings.notifyEmergencyContacts}
                    onValueChange={handleToggleNotify}
                    trackColor={{ false: '#ccc', true: '#22c55e' }}
                    thumbColor="#fff"
                    disabled={updateMutation.isPending}
                  />
                </View>

                {/* Notification Method */}
                {localSettings.notifyEmergencyContacts && (
                  <View>
                    <Text
                      className="mb-3 text-sm font-medium text-gray-700"
                      style={{ fontFamily: 'Inter' }}
                    >
                      How to notify contacts:
                    </Text>
                    {NOTIFICATION_METHODS.map(method => (
                      <TouchableOpacity
                        key={method.value}
                        onPress={() =>
                          handleMethodChange(
                            method.value as 'sms' | 'push' | 'both'
                          )
                        }
                        disabled={updateMutation.isPending}
                        className={`mb-2 flex-row items-center rounded-xl p-3 ${
                          localSettings.emergencyNotificationMethod ===
                          method.value
                            ? 'border border-primary bg-primary/10'
                            : 'bg-gray-50'
                        }`}
                      >
                        <Ionicons
                          name={method.icon}
                          size={20}
                          color={
                            localSettings.emergencyNotificationMethod ===
                            method.value
                              ? '#E63946'
                              : '#6b7280'
                          }
                        />
                        <Text
                          className={`ml-3 flex-1 ${
                            localSettings.emergencyNotificationMethod ===
                            method.value
                              ? 'font-medium text-primary'
                              : 'text-gray-700'
                          }`}
                          style={{ fontFamily: 'Inter' }}
                        >
                          {method.label}
                        </Text>
                        {localSettings.emergencyNotificationMethod ===
                          method.value && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#E63946"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          {/* SMS Fallback Section */}
          <View
            className="mb-6 rounded-2xl bg-white p-4 shadow-sm"
            style={{ elevation: 2 }}
          >
            <View className="mb-4 flex-row items-center">
              <View className="mr-3 rounded-full bg-amber-100 p-2">
                <Ionicons
                  name="cloud-offline-outline"
                  size={20}
                  color="#D97706"
                />
              </View>
              <Text
                className="text-lg text-gray-800"
                style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
              >
                Offline SMS Fallback
              </Text>
            </View>

            <Text
              className="text-sm text-gray-600 mb-3"
              style={{ fontFamily: 'Inter' }}
            >
              When you're offline, you can still request emergency help via SMS.
              The message will be sent to our emergency SMS gateway.
            </Text>

            <View className="bg-amber-50 rounded-xl p-3 mb-3">
              <View className="flex-row items-center">
                <Ionicons name="information-circle" size={18} color="#D97706" />
                <Text
                  className="ml-2 text-amber-800 text-sm flex-1"
                  style={{ fontFamily: 'Inter' }}
                >
                  SMS Gateway: {SMS_FALLBACK_NUMBER}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/sms-emergency')}
              className="flex-row items-center justify-between rounded-xl bg-gray-50 p-4"
            >
              <View className="flex-row items-center">
                <Ionicons name="send-outline" size={20} color="#6b7280" />
                <Text
                  className="ml-3 text-gray-700"
                  style={{ fontFamily: 'Inter' }}
                >
                  Test SMS Emergency
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Quick Links Section */}
          <View
            className="mb-6 rounded-2xl bg-white p-4 shadow-sm"
            style={{ elevation: 2 }}
          >
            <Text
              className="mb-4 text-lg text-gray-800"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
            >
              Quick Links
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/emergency-contacts')}
              className="mb-3 flex-row items-center justify-between rounded-xl bg-gray-50 p-4"
            >
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={20} color="#6b7280" />
                <Text
                  className="ml-3 text-gray-700"
                  style={{ fontFamily: 'Inter' }}
                >
                  Manage Emergency Contacts
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(tabs)/profile')}
              className="mb-3 flex-row items-center justify-between rounded-xl bg-gray-50 p-4"
            >
              <View className="flex-row items-center">
                <Ionicons name="person-outline" size={20} color="#6b7280" />
                <Text
                  className="ml-3 text-gray-700"
                  style={{ fontFamily: 'Inter' }}
                >
                  Edit Profile
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/change-password')}
              className="flex-row items-center justify-between rounded-xl bg-gray-50 p-4"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#6b7280"
                />
                <Text
                  className="ml-3 text-gray-700"
                  style={{ fontFamily: 'Inter' }}
                >
                  Change Password
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
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

            <TouchableOpacity
              onPress={() => router.push('/help-support')}
              className="mb-3 flex-row items-center justify-between rounded-xl bg-gray-50 p-4"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="help-circle-outline"
                  size={20}
                  color="#6b7280"
                />
                <Text
                  className="ml-3 text-gray-700"
                  style={{ fontFamily: 'Inter' }}
                >
                  Help & Support
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/terms-of-service')}
              className="mb-3 flex-row items-center justify-between rounded-xl bg-gray-50 p-4"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="document-text-outline"
                  size={20}
                  color="#6b7280"
                />
                <Text
                  className="ml-3 text-gray-700"
                  style={{ fontFamily: 'Inter' }}
                >
                  Terms of Service
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/privacy-policy')}
              className="mb-3 flex-row items-center justify-between rounded-xl bg-gray-50 p-4"
            >
              <View className="flex-row items-center">
                <Ionicons name="shield-outline" size={20} color="#6b7280" />
                <Text
                  className="ml-3 text-gray-700"
                  style={{ fontFamily: 'Inter' }}
                >
                  Privacy Policy
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>

            <View className="items-center pt-2">
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
