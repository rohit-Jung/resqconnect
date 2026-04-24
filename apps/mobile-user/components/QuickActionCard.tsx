import { Ionicons } from '@expo/vector-icons';

import { Text, TouchableOpacity, View } from 'react-native';

// Quick Action Card Component
interface QuickActionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  color: string;
  onPress?: () => void;
  disabled?: boolean;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  title,
  color,
  onPress,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      className={`mb-4 w-[48%] items-center rounded-2xl bg-gray-50 p-4 ${disabled ? 'opacity-50' : ''}`}
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
    >
      <View
        className="mb-3 h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}20` }}
      >
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text
        className="text-center text-sm text-gray-700"
        style={{ fontFamily: 'Inter' }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};
