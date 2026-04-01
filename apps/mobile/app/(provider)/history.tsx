import { Ionicons } from '@expo/vector-icons';

import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { useGetProviderEmergencyHistory } from '@/services/emergency/emergency.api';
import {
  EmergencyStatus,
  IEmergencyHistoryItem,
} from '@/types/emergency.types';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const BLACK = '#000000';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const SUCCESS_GREEN = '#10B981';

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  [EmergencyStatus.COMPLETED]: {
    bg: SUCCESS_GREEN,
    text: '#FFFFFF',
    label: 'COMPLETED',
  },
  [EmergencyStatus.CANCELLED]: {
    bg: MID_GRAY,
    text: '#FFFFFF',
    label: 'CANCELLED',
  },
  [EmergencyStatus.PENDING]: {
    bg: '#F59E0B',
    text: '#FFFFFF',
    label: 'PENDING',
  },
  [EmergencyStatus.ACCEPTED]: {
    bg: '#3B82F6',
    text: '#FFFFFF',
    label: 'ACCEPTED',
  },
  [EmergencyStatus.IN_PROGRESS]: {
    bg: '#3B82F6',
    text: '#FFFFFF',
    label: 'IN PROGRESS',
  },
  [EmergencyStatus.NO_PROVIDERS]: {
    bg: SIGNAL_RED,
    text: '#FFFFFF',
    label: 'NO PROVIDERS',
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

const formatDistance = (meters?: number) => {
  if (!meters) return 'N/A';
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

const HistoryItemCard: React.FC<{ item: IEmergencyHistoryItem }> = ({
  item,
}) => {
  const statusStyle =
    STATUS_STYLES[item.status] || STATUS_STYLES[EmergencyStatus.PENDING];
  const icon = EMERGENCY_TYPE_ICONS[item.emergencyType] || 'alert-circle';

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyCardHeader}>
        <View style={styles.historyCardLeft}>
          <View style={styles.historyIconContainer}>
            <Ionicons name={icon} size={24} color={SIGNAL_RED} />
          </View>
          <View style={styles.historyCardInfo}>
            <Text style={styles.historyCardTitle}>
              {item.emergencyType.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.historyCardDesc} numberOfLines={1}>
              {item.emergencyDescription || 'No description'}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.historyStatusBadge,
            { backgroundColor: statusStyle.bg },
          ]}
        >
          <Text style={[styles.historyStatusText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <View style={styles.historyCardFooter}>
        <View style={styles.historyCardMeta}>
          <Ionicons name="time-outline" size={14} color={MID_GRAY} />
          <Text style={styles.historyCardMetaText}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        <View style={styles.historyCardStats}>
          {item.responseTime && (
            <View style={styles.historyCardMeta}>
              <Ionicons name="speedometer-outline" size={14} color={MID_GRAY} />
              <Text style={styles.historyCardMetaText}>
                {formatResponseTime(item.responseTime)}
              </Text>
            </View>
          )}
          {item.distanceTraveled && (
            <View style={[styles.historyCardMeta, { marginLeft: 12 }]}>
              <Ionicons name="car-outline" size={14} color={MID_GRAY} />
              <Text style={styles.historyCardMetaText}>
                {formatDistance(item.distanceTraveled)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {item.user && (
        <View style={styles.historyUserCard}>
          <Ionicons name="person-circle-outline" size={20} color={MID_GRAY} />
          <Text style={styles.historyUserName}>{item.user.name}</Text>
          {item.user.phoneNumber && (
            <Text style={styles.historyUserPhone}>{item.user.phoneNumber}</Text>
          )}
        </View>
      )}
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
    style={[styles.filterChip, active && styles.filterChipActive]}
    activeOpacity={0.7}
  >
    <Text
      style={[styles.filterChipText, active && styles.filterChipTextActive]}
    >
      {label.toUpperCase()}
    </Text>
  </TouchableOpacity>
);

export default function ProviderHistoryScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const statusParam = filter === 'all' ? undefined : filter;
  const { data, isLoading, refetch, isError, error } =
    useGetProviderEmergencyHistory({ status: statusParam }, true);

  const historyData = data?.data;
  const history = historyData?.history || [];
  const stats = historyData?.stats;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>RESQ</Text>
            <Text style={styles.brandDot}>.</Text>
          </View>
        </View>
        <View style={styles.headerLine} />
        <Text style={styles.tagline}>RESPONSE HISTORY</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[SIGNAL_RED]}
            tintColor={SIGNAL_RED}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {stats && (
          <View style={styles.statsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SUMMARY</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>TOTAL</Text>
              </View>
              <View style={[styles.statCard, { borderColor: SUCCESS_GREEN }]}>
                <Text style={[styles.statValue, { color: SUCCESS_GREEN }]}>
                  {stats.completed}
                </Text>
                <Text style={styles.statLabel}>COMPLETED</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.cancelled}</Text>
                <Text style={styles.statLabel}>CANCELLED</Text>
              </View>
              <View style={[styles.statCard, { borderColor: '#3B82F6' }]}>
                <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                  {formatResponseTime(stats.avgResponseTime)}
                </Text>
                <Text style={styles.statLabel}>AVG RESPONSE</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.filtersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>FILTER</Text>
            <View style={styles.sectionLine} />
          </View>
          <View style={styles.filtersRow}>
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
        </View>

        {isLoading && !refreshing ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={SIGNAL_RED} />
            <Text style={styles.loadingText}>LOADING HISTORY...</Text>
          </View>
        ) : isError ? (
          <EmptyState
            icon="alert-circle"
            title="Failed to load history"
            description="There was an error loading your response history. Please try again."
            actionLabel="RETRY"
            onAction={onRefresh}
            iconColor={SIGNAL_RED}
          />
        ) : history.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="No response history"
            description={
              filter === 'all'
                ? "You haven't responded to any emergencies yet. Your history will appear here."
                : `No ${filter} responses found.`
            }
            iconColor={LIGHT_GRAY}
          />
        ) : (
          <View>
            <Text style={styles.historyCount}>
              {history.length} RESPONSE{history.length !== 1 ? 'S' : ''}
            </Text>
            {history.map(item => (
              <HistoryItemCard key={item.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  header: {
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 28,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 28,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 34,
  },
  headerLine: {
    width: 36,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 6,
    marginBottom: 6,
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
    paddingTop: 24,
    paddingBottom: 100,
  },
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  statCard: {
    width: '48%',
    backgroundColor: OFF_WHITE,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    padding: 16,
    marginHorizontal: '1%',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: PRIMARY,
    letterSpacing: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
  },
  filtersSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  filtersRow: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 1,
  },
  filterChipTextActive: {
    color: OFF_WHITE,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 10,
    color: MID_GRAY,
    letterSpacing: 2,
    marginTop: 16,
  },
  historyCount: {
    fontSize: 10,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 2,
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  historyCard: {
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    padding: 16,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  historyCardInfo: {
    flex: 1,
  },
  historyCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 1,
    marginBottom: 4,
  },
  historyCardDesc: {
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 0.5,
  },
  historyStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  historyStatusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  historyCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
  },
  historyCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyCardMetaText: {
    fontSize: 11,
    color: MID_GRAY,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  historyUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
    padding: 8,
    marginTop: 12,
  },
  historyUserName: {
    fontSize: 12,
    color: BLACK,
    marginLeft: 8,
  },
  historyUserPhone: {
    fontSize: 11,
    color: MID_GRAY,
    marginLeft: 8,
  },
});
