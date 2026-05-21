import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import {
  ActivityIndicator,
  Animated,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS } from '../constants';
import { emergencyTrackingStatusCardProviderStyles as styles } from '../stylesheet';
import type {
  EmergencyIconInfo,
  EmergencyStatusMessage,
  RouteInfo,
} from '../types';

export function EmergencyTrackingStatusCardProvider({
  emergencyInfo,
  statusMessage,
  status,
  pulseAnim,
  routeInfo,
  isLoadingRoute,
  isConfirmingArrival,
  isConnected,
  onConfirmArrival,
}: {
  emergencyInfo: EmergencyIconInfo;
  statusMessage: EmergencyStatusMessage;
  status: string;
  pulseAnim: Animated.AnimatedValue;
  routeInfo: RouteInfo | null;
  isLoadingRoute: boolean;
  isConfirmingArrival: boolean;
  isConnected: boolean;
  onConfirmArrival: () => void;
}) {
  return (
    <View style={styles.statusCard}>
      <View
        style={[styles.typeBadge, { backgroundColor: emergencyInfo.color }]}
      >
        <MaterialCommunityIcons
          name={emergencyInfo.icon as any}
          size={24}
          color="#fff"
        />
        <Text style={styles.typeBadgeText}>
          {emergencyInfo.label} Emergency
        </Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Responder</Text>
        </View>
      </View>

      <View style={styles.statusSection}>
        {status === 'pending' && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <ActivityIndicator size="small" color={statusMessage.color} />
          </Animated.View>
        )}
        {status === 'accepted' && (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={statusMessage.color}
          />
        )}
        <Text style={[styles.statusText, { color: statusMessage.color }]}>
          {statusMessage.message}
        </Text>
      </View>

      {!!routeInfo && (status === 'accepted' || status === 'in_progress') && (
        <View style={styles.routeInfoSwiss}>
          <View style={styles.routeInfoSwissItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.MID_GRAY} />
            <Text style={styles.routeInfoSwissText}>
              {routeInfo.duration} min
            </Text>
          </View>
          <View style={styles.routeInfoSwissDivider} />
          <View style={styles.routeInfoSwissItem}>
            <Ionicons
              name="navigate-outline"
              size={16}
              color={COLORS.MID_GRAY}
            />
            <Text style={styles.routeInfoSwissText}>
              {routeInfo.distance} km
            </Text>
          </View>
          {isLoadingRoute && (
            <ActivityIndicator
              size="small"
              color={COLORS.MID_GRAY}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      )}

      {!!routeInfo && (status === 'accepted' || status === 'in_progress') && (
        <View style={styles.hairline} />
      )}

      {status === 'accepted' && (
        <TouchableOpacity
          style={styles.confirmArrivalButton}
          onPress={onConfirmArrival}
          disabled={isConfirmingArrival}
        >
          {isConfirmingArrival ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.confirmArrivalButtonText}>
                Confirm Arrival
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.connectionStatus}>
        <View
          style={[
            styles.connectionDot,
            { backgroundColor: isConnected ? '#10B981' : '#EF4444' },
          ]}
        />
        <Text style={styles.connectionText}>
          {isConnected ? 'Live Tracking Active' : 'Reconnecting...'}
        </Text>
      </View>
    </View>
  );
}
