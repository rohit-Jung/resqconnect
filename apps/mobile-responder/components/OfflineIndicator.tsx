import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

interface OfflineIndicatorProps {
  isOffline: boolean;
  onSMSFallback?: () => void;
  showSMSOption?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOffline,
  onSMSFallback,
  showSMSOption = true,
}) => {
  const router = useRouter();

  if (!isOffline) return null;

  const handleSMSPress = () => {
    if (onSMSFallback) {
      onSMSFallback();
    } else {
      // mobile-responder app does not include the sms-emergency screen.
      router.push('/(provider)/dashboard');
    }
  };

  return (
    <View className="bg-amber-500 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-amber-600">
            <Ionicons name="cloud-offline-outline" size={18} color="#fff" />
          </View>
          <View className="ml-3 flex-1">
            <Text
              className="text-sm font-semibold text-white"
              style={{ fontFamily: 'Inter' }}
            >
              You are Offline
            </Text>
            <Text
              className="text-xs text-amber-100"
              style={{ fontFamily: 'Inter' }}
            >
              Internet connection unavailable
            </Text>
          </View>
        </View>
        {showSMSOption && (
          <TouchableOpacity
            onPress={handleSMSPress}
            className="flex-row items-center rounded-full bg-white px-3 py-2"
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-outline" size={16} color="#F59E0B" />
            <Text
              className="ml-1 text-xs font-semibold text-amber-600"
              style={{ fontFamily: 'Inter' }}
            >
              Use SMS
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Compact version for use in headers
interface OfflineBadgeProps {
  isOffline: boolean;
}

export const OfflineBadge: React.FC<OfflineBadgeProps> = ({ isOffline }) => {
  if (!isOffline) return null;

  return (
    <View className="flex-row items-center rounded-full bg-amber-500 px-2 py-1">
      <Ionicons name="cloud-offline-outline" size={12} color="#fff" />
      <Text className="ml-1 text-xs text-white" style={{ fontFamily: 'Inter' }}>
        Offline
      </Text>
    </View>
  );
};

export default OfflineIndicator;
