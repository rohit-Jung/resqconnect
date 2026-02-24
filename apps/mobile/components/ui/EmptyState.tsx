import { Ionicons } from '@expo/vector-icons';

import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  iconColor?: string;
  iconSize?: number;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor = '#d1d5db',
  iconSize = 64,
}) => {
  return (
    <View className="items-center justify-center py-12 px-6">
      <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-gray-100">
        <Ionicons name={icon} size={iconSize} color={iconColor} />
      </View>
      <Text
        className="text-center text-lg text-gray-600 font-medium"
        style={{ fontFamily: 'Inter' }}
      >
        {title}
      </Text>
      {description && (
        <Text
          className="mt-2 text-center text-sm text-gray-400 max-w-xs"
          style={{ fontFamily: 'Inter' }}
        >
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="mt-6 rounded-xl bg-primary px-6 py-3"
          activeOpacity={0.8}
        >
          <Text
            className="text-white font-semibold"
            style={{ fontFamily: 'Inter' }}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState;
