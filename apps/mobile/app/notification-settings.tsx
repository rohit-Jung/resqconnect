import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();

  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'emergency_alerts',
      title: 'Emergency Alerts',
      description: 'Receive alerts for incoming emergency requests',
      enabled: true,
      icon: 'warning',
    },
    {
      id: 'status_updates',
      title: 'Status Updates',
      description: 'Get notified when your request status changes',
      enabled: true,
      icon: 'sync',
    },
    {
      id: 'provider_arrival',
      title: 'Provider Arrival',
      description: 'Alert when responder is arriving',
      enabled: true,
      icon: 'car',
    },
    {
      id: 'contact_notifications',
      title: 'Emergency Contact Alerts',
      description: 'Notify contacts when you request help',
      enabled: true,
      icon: 'people',
    },
    {
      id: 'app_updates',
      title: 'App Updates',
      description: 'News about new features and improvements',
      enabled: false,
      icon: 'megaphone',
    },
    {
      id: 'tips_reminders',
      title: 'Safety Tips & Reminders',
      description: 'Periodic safety tips and emergency preparedness',
      enabled: false,
      icon: 'bulb',
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
    // In a real app, this would also update the backend
  };

  const handleSave = () => {
    Alert.alert('Success', 'Notification preferences saved');
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
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
            Notification Settings
          </Text>
          <View className="w-6" />
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Info Banner */}
        <View className="bg-blue-50 rounded-2xl p-4 mb-4 flex-row">
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text
            className="ml-2 text-sm text-blue-800 flex-1"
            style={{ fontFamily: 'Inter' }}
          >
            Critical emergency notifications cannot be disabled to ensure your
            safety.
          </Text>
        </View>

        {/* Critical Notifications Section */}
        <Text
          className="text-lg text-gray-800 mb-3"
          style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
        >
          Critical Notifications
        </Text>

        <View
          className="bg-white rounded-2xl shadow-sm mb-6"
          style={{ elevation: 2 }}
        >
          {settings.slice(0, 4).map((setting, index) => (
            <View
              key={setting.id}
              className={`flex-row items-center justify-between p-4 ${
                index < 3 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="flex-row items-center flex-1">
                <View className="h-10 w-10 rounded-full bg-red-50 items-center justify-center mr-3">
                  <Ionicons name={setting.icon} size={20} color="#E13333" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-base font-medium text-gray-800"
                    style={{ fontFamily: 'Inter' }}
                  >
                    {setting.title}
                  </Text>
                  <Text
                    className="text-sm text-gray-500 mt-0.5"
                    style={{ fontFamily: 'Inter' }}
                  >
                    {setting.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => {
                  if (setting.id === 'emergency_alerts') {
                    Alert.alert(
                      'Cannot Disable',
                      'Emergency alerts cannot be disabled for your safety.'
                    );
                    return;
                  }
                  toggleSetting(setting.id);
                }}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Optional Notifications Section */}
        <Text
          className="text-lg text-gray-800 mb-3"
          style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
        >
          Optional Notifications
        </Text>

        <View
          className="bg-white rounded-2xl shadow-sm mb-6"
          style={{ elevation: 2 }}
        >
          {settings.slice(4).map((setting, index) => (
            <View
              key={setting.id}
              className={`flex-row items-center justify-between p-4 ${
                index < settings.slice(4).length - 1
                  ? 'border-b border-gray-100'
                  : ''
              }`}
            >
              <View className="flex-row items-center flex-1">
                <View className="h-10 w-10 rounded-full bg-gray-100 items-center justify-center mr-3">
                  <Ionicons name={setting.icon} size={20} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-base font-medium text-gray-800"
                    style={{ fontFamily: 'Inter' }}
                  >
                    {setting.title}
                  </Text>
                  <Text
                    className="text-sm text-gray-500 mt-0.5"
                    style={{ fontFamily: 'Inter' }}
                  >
                    {setting.description}
                  </Text>
                </View>
              </View>
              <Switch
                value={setting.enabled}
                onValueChange={() => toggleSetting(setting.id)}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </View>

        {/* Sound Settings */}
        <Text
          className="text-lg text-gray-800 mb-3"
          style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
        >
          Sound & Vibration
        </Text>

        <View
          className="bg-white rounded-2xl shadow-sm"
          style={{ elevation: 2 }}
        >
          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center flex-1">
              <View className="h-10 w-10 rounded-full bg-purple-50 items-center justify-center mr-3">
                <Ionicons name="volume-high" size={20} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text
                  className="text-base font-medium text-gray-800"
                  style={{ fontFamily: 'Inter' }}
                >
                  Notification Sound
                </Text>
                <Text
                  className="text-sm text-gray-500 mt-0.5"
                  style={{ fontFamily: 'Inter' }}
                >
                  Emergency Alert
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center flex-1">
              <View className="h-10 w-10 rounded-full bg-purple-50 items-center justify-center mr-3">
                <Ionicons name="phone-portrait" size={20} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text
                  className="text-base font-medium text-gray-800"
                  style={{ fontFamily: 'Inter' }}
                >
                  Vibration
                </Text>
                <Text
                  className="text-sm text-gray-500 mt-0.5"
                  style={{ fontFamily: 'Inter' }}
                >
                  Vibrate for notifications
                </Text>
              </View>
            </View>
            <Switch
              value={true}
              onValueChange={() => {}}
              trackColor={{ false: '#E5E7EB', true: '#10B981' }}
              thumbColor="#fff"
            />
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="px-5 pb-6 pt-3 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSave}
          className="bg-primary rounded-2xl py-4 flex-row items-center justify-center"
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
          <Text
            className="ml-2 text-white font-bold text-lg"
            style={{ fontFamily: 'Inter' }}
          >
            Save Preferences
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
