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
import { useGetUserEmergencyHistory } from '@/services/emergency/emergency.api';
import {
  EmergencyStatus,
  IEmergencyHistoryItem,
} from '@/types/emergency.types';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';
const SUCCESS_GREEN = '#10B981';
const WARNING_AMBER = '#F59E0B';

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  [EmergencyStatus.COMPLETED]: {
    bg: '#D1FAE5',
    text: '#059669',
    label: 'COMPLETED',
  },
  [EmergencyStatus.CANCELLED]: {
    bg: LIGHT_GRAY,
    text: MID_GRAY,
    label: 'CANCELLED',
  },
  [EmergencyStatus.PENDING]: {
    bg: '#FEF3C7',
    text: '#D97706',
    label: 'PENDING',
  },
  [EmergencyStatus.ACCEPTED]: {
    bg: '#DBEAFE',
    text: '#2563EB',
    label: 'ACCEPTED',
  },
  [EmergencyStatus.IN_PROGRESS]: {
    bg: '#DBEAFE',
    text: '#2563EB',
    label: 'IN PROGRESS',
  },
  [EmergencyStatus.NO_PROVIDERS]: {
    bg: '#FEE2E2',
    text: '#DC2626',
    label: 'NO RESPONDERS',
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
    <View style={styles.historyCard}>
      <View style={styles.cardHeader}>
        <View style={styles.emergencyType}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color={SIGNAL_RED} />
          </View>
          <View style={styles.typeInfo}>
            <Text style={styles.emergencyTypeText}>
              {item.emergencyType.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.emergencyDescription} numberOfLines={1}>
              {item.emergencyDescription || 'No description'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={MID_GRAY} />
          <Text style={styles.metaText}>{formatDate(item.createdAt)}</Text>
        </View>
        {item.responseTime && (
          <View style={styles.metaItem}>
            <Ionicons name="speedometer-outline" size={14} color={MID_GRAY} />
            <Text style={styles.metaText}>
              Response: {formatResponseTime(item.responseTime)}
            </Text>
          </View>
        )}
      </View>

      {item.provider && (
        <View style={styles.providerRow}>
          <Ionicons name="person-circle-outline" size={18} color={MID_GRAY} />
          <Text style={styles.providerName}>{item.provider.name}</Text>
          {item.provider.vehicleNumber && (
            <Text style={styles.vehicleNumber}>
              ({item.provider.vehicleNumber})
            </Text>
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
    style={[styles.filterChip, active && styles.filterChipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterText, active && styles.filterTextActive]}>
      {label.toUpperCase()}
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

  const responseData = data?.data;
  // Handle both array response and object response formats
  const history = Array.isArray(responseData)
    ? responseData
    : responseData?.history || [];

  console.log('RESPONSE', history);
  const stats = Array.isArray(responseData) ? undefined : responseData?.stats;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={styles.container}>
      {/* Header - Swiss style */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>RESQ</Text>
            <Text style={styles.brandDot}>.</Text>
          </View>
          <View style={styles.headerLine} />
          <Text style={styles.tagline}>EMERGENCY HISTORY</Text>
        </View>
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
        {/* Stats Section */}
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

        {/* Filters */}
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

        {/* Content */}
        {isLoading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>LOADING HISTORY...</Text>
          </View>
        ) : isError ? (
          <EmptyState
            icon="alert-circle"
            title="Failed to load history"
            description="There was an error loading your emergency history. Please try again."
            actionLabel="Retry"
            onAction={onRefresh}
            iconColor={SIGNAL_RED}
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
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsCount}>
                {history.length} REQUEST{history.length !== 1 ? 'S' : ''}
              </Text>
            </View>
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
  headerContent: {},
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
    width: 48,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 8,
    marginBottom: 8,
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
    paddingBottom: 40,
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
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
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
  filterText: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
  },
  filterTextActive: {
    color: OFF_WHITE,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 10,
    color: MID_GRAY,
    letterSpacing: 2,
    marginTop: 16,
  },
  resultsHeader: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  historyCard: {
    marginHorizontal: 24,
    marginBottom: 12,
    backgroundColor: OFF_WHITE,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  emergencyType: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  typeInfo: {
    flex: 1,
  },
  emergencyTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 1,
    marginBottom: 2,
  },
  emergencyDescription: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardDivider: {
    height: 1,
    backgroundColor: LIGHT_GRAY,
    marginVertical: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 10,
    color: MID_GRAY,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
    padding: 10,
  },
  providerName: {
    fontSize: 11,
    color: PRIMARY,
    marginLeft: 8,
    fontWeight: '600',
  },
  vehicleNumber: {
    fontSize: 10,
    color: MID_GRAY,
    marginLeft: 4,
  },
});
