import { Ionicons } from '@expo/vector-icons';

import React from 'react';
import { Text, View } from 'react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconColor = '#E13333',
  iconBgColor = '#FEE2E2',
  subtitle,
  trend,
}) => {
  return (
    <View
      className="flex-1 rounded-2xl bg-white p-4 shadow-sm"
      style={{ elevation: 2, minWidth: 140 }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: iconBgColor }}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        {trend && (
          <View
            className={`flex-row items-center px-2 py-1 rounded-full ${trend.isPositive ? 'bg-green-100' : 'bg-red-100'}`}
          >
            <Ionicons
              name={trend.isPositive ? 'arrow-up' : 'arrow-down'}
              size={12}
              color={trend.isPositive ? '#10B981' : '#EF4444'}
            />
            <Text
              className={`text-xs ml-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}
              style={{ fontFamily: 'Inter' }}
            >
              {trend.value}%
            </Text>
          </View>
        )}
      </View>
      <Text
        className="text-2xl font-bold text-gray-800"
        style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
      >
        {value}
      </Text>
      <Text
        className="text-sm text-gray-500 mt-1"
        style={{ fontFamily: 'Inter' }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          className="text-xs text-gray-400 mt-1"
          style={{ fontFamily: 'Inter' }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
};

interface StatGridProps {
  children: React.ReactNode;
  columns?: 2 | 3;
}

export const StatGrid: React.FC<StatGridProps> = ({
  children,
  columns = 2,
}) => {
  return (
    <View className={`flex-row flex-wrap ${columns === 2 ? 'gap-3' : 'gap-2'}`}>
      {React.Children.map(children, (child, index) => (
        <View style={{ width: columns === 2 ? '48%' : '31%' }}>{child}</View>
      ))}
    </View>
  );
};

export default StatCard;
