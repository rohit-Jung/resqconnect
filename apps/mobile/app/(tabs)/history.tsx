import { Ionicons } from '@expo/vector-icons';

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard, StatGrid } from '@/components/ui/StatCard';
import { useGetUserEmergencyHistory } from '@/services/emergency/emergency.api';
import {
  EmergencyStatus,
  IEmergencyHistoryItem,
} from '@/types/emergency.types';

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  [EmergencyStatus.COMPLETED]: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    label: 'Completed',
  },
  [EmergencyStatus.CANCELLED]: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    label: 'Cancelled',
  },
  [EmergencyStatus.PENDING]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    label: 'Pending',
  },
  [EmergencyStatus.ACCEPTED]: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'Accepted',
  },
  [EmergencyStatus.IN_PROGRESS]: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    label: 'In Progress',
  },
  [EmergencyStatus.NO_PROVIDERS]: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    label: 'No Providers',
  },
};

const EMERGENCY_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  ambulance: 'medical',
  police: 'shield',
  fire_truck: 'flame',
  rescue_team: 'people',
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatResponseTime = (seconds?: number) => {
  if (!seconds) return 'N/A';
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
};

const HistoryItemCard: React.FC<{ item: IEmergencyHistoryItem }> = ({
  item,
}) => {
  const statusStyle =
    STATUS_COLORS[item.status] || STATUS_COLORS[EmergencyStatus.PENDING];
  const icon = EMERGENCY_TYPE_ICONS[item.emergencyType] || 'alert-circle';

  return (
    <View
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
      style={{ elevation: 2 }}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center flex-1">
          <View className="h-12 w-12 rounded-full bg-red-50 items-center justify-center mr-3">
            <Ionicons name={icon} size={24} color="#E13333" />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-semibold text-gray-800 capitalize"
              style={{ fontFamily: 'Inter' }}
            >
              {item.emergencyType.replace('_', ' ')}
            </Text>
            <Text
              className="text-sm text-gray-500 mt-0.5"
              style={{ fontFamily: 'Inter' }}
              numberOfLines={1}
            >
              {item.emergencyDescription || 'No description'}
            </Text>
          </View>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${statusStyle.bg}`}>
          <Text
            className={`text-xs font-medium ${statusStyle.text}`}
            style={{ fontFamily: 'Inter' }}
          >
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <View className="mt-3 pt-3 border-t border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text
              className="text-xs text-gray-500 ml-1"
              style={{ fontFamily: 'Inter' }}
            >
              {formatDate(item.createdAt)}
            </Text>
          </View>
          {item.responseTime && (
            <View className="flex-row items-center">
              <Ionicons name="speedometer-outline" size={14} color="#9CA3AF" />
              <Text
                className="text-xs text-gray-500 ml-1"
                style={{ fontFamily: 'Inter' }}
              >
                Response: {formatResponseTime(item.responseTime)}
              </Text>
            </View>
          )}
        </View>

        {item.provider && (
          <View className="mt-2 flex-row items-center bg-gray-50 rounded-lg p-2">
            <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
            <Text
              className="text-sm text-gray-600 ml-2"
              style={{ fontFamily: 'Inter' }}
            >
              {item.provider.name}
            </Text>
            {item.provider.vehicleNumber && (
              <Text
                className="text-xs text-gray-400 ml-2"
                style={{ fontFamily: 'Inter' }}
              >
                ({item.provider.vehicleNumber})
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

type FilterType = 'all' | 'completed' | 'cancelled';

const FilterChip: React.FC<{
  label: string;
  active: boolean;
  onPress: () => void;
}> = ({ label, active, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-4 py-2 rounded-full mr-2 ${
      active ? 'bg-primary' : 'bg-gray-100'
    }`}
    activeOpacity={0.7}
  >
    <Text
      className={`text-sm font-medium ${active ? 'text-white' : 'text-gray-600'}`}
      style={{ fontFamily: 'Inter' }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

export default function HistoryScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const statusParam = filter === 'all' ? undefined : filter;
  const { data, isLoading, refetch, isError } = useGetUserEmergencyHistory(
    { status: statusParam },
    true
  );

  const historyData = data?.data;
  const history = historyData?.history || [];
  const stats = historyData?.stats;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <Text
          className="text-2xl text-gray-800"
          style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
        >
          Emergency History
        </Text>
        <Text
          className="text-sm text-gray-500 mt-1"
          style={{ fontFamily: 'Inter' }}
        >
          Your past emergency requests
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#E13333']}
            tintColor="#E13333"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section */}
        {stats && (
          <View className="mt-4 mb-4">
            <StatGrid columns={2}>
              <StatCard
                title="Total Requests"
                value={stats.total}
                icon="document-text"
                iconColor="#E13333"
                iconBgColor="#FEE2E2"
              />
              <StatCard
                title="Completed"
                value={stats.completed}
                icon="checkmark-circle"
                iconColor="#10B981"
                iconBgColor="#D1FAE5"
              />
            </StatGrid>
            <View className="mt-3">
              <StatGrid columns={2}>
                <StatCard
                  title="Cancelled"
                  value={stats.cancelled}
                  icon="close-circle"
                  iconColor="#6B7280"
                  iconBgColor="#F3F4F6"
                />
                <StatCard
                  title="Avg Response"
                  value={formatResponseTime(stats.avgResponseTime)}
                  icon="timer"
                  iconColor="#3B82F6"
                  iconBgColor="#DBEAFE"
                />
              </StatGrid>
            </View>
          </View>
        )}

        {/* Filters */}
        <View className="flex-row mt-2 mb-4">
          <FilterChip
            label="All"
            active={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <FilterChip
            label="Completed"
            active={filter === 'completed'}
            onPress={() => setFilter('completed')}
          />
          <FilterChip
            label="Cancelled"
            active={filter === 'cancelled'}
            onPress={() => setFilter('cancelled')}
          />
        </View>

        {/* Content */}
        {isLoading && !refreshing ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#E13333" />
            <Text
              className="text-gray-500 mt-4"
              style={{ fontFamily: 'Inter' }}
            >
              Loading history...
            </Text>
          </View>
        ) : isError ? (
          <EmptyState
            icon="alert-circle"
            title="Failed to load history"
            description="There was an error loading your emergency history. Please try again."
            actionLabel="Retry"
            onAction={onRefresh}
            iconColor="#EF4444"
          />
        ) : history.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="No emergency history"
            description={
              filter === 'all'
                ? "You haven't made any emergency requests yet. Your history will appear here."
                : `No ${filter} requests found.`
            }
          />
        ) : (
          <View>
            <Text
              className="text-sm text-gray-500 mb-3"
              style={{ fontFamily: 'Inter' }}
            >
              {history.length} request{history.length !== 1 ? 's' : ''}
            </Text>
            {history.map(item => (
              <HistoryItemCard key={item.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
