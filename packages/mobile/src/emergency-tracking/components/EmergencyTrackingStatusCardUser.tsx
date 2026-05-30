import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import {
  ActivityIndicator,
  Animated,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { COLORS } from '../constants';
import { emergencyTrackingStatusCardUserStyles as styles } from '../stylesheet';
import type {
  EmergencyIconInfo,
  EmergencyStatusMessage,
  RouteInfo,
} from '../types';

export function EmergencyTrackingStatusCardUser({
  emergencyInfo,
  statusMessage,
  status,
  pulseAnim,
  routeInfo,
  isLoadingRoute,
  nearbyProvidersCount,
  assignedProvider,
  isCancelling,
  isConfirmingArrival,
  isConnected,
  onCancel,
  onConfirmArrival,
}: {
  emergencyInfo: EmergencyIconInfo;
  statusMessage: EmergencyStatusMessage;
  status: string;
  pulseAnim: Animated.AnimatedValue;
  routeInfo: RouteInfo | null;
  isLoadingRoute: boolean;
  nearbyProvidersCount: number;
  assignedProvider: {
    name: string;
    vehicleNumber?: string;
    phoneNumber?: string;
  } | null;
  isCancelling: boolean;
  isConfirmingArrival: boolean;
  isConnected: boolean;
  onCancel: () => void;
  onConfirmArrival: () => void;
}) {
  const onCallProvider = () => {
    if (assignedProvider?.phoneNumber)
      Linking.openURL(`tel:${assignedProvider.phoneNumber}`);
  };

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

      {status === 'pending' && nearbyProvidersCount > 0 && (
        <Text style={styles.providersCount}>
          {nearbyProvidersCount} provider{nearbyProvidersCount > 1 ? 's' : ''}{' '}
          nearby
        </Text>
      )}

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

      {!!assignedProvider && (
        <View style={styles.providerInfo}>
          <View style={styles.providerHeader}>
            <View style={styles.providerAvatar}>
              <MaterialCommunityIcons name="account" size={20} color="#fff" />
            </View>
            <View style={styles.providerDetails}>
              <Text style={styles.providerName}>{assignedProvider.name}</Text>
              {!!assignedProvider.vehicleNumber && (
                <Text style={styles.providerVehicle}>
                  {assignedProvider.vehicleNumber}
                </Text>
              )}
            </View>
          </View>
          {!!assignedProvider.phoneNumber && (
            <TouchableOpacity
              style={styles.callButton}
              onPress={onCallProvider}
            >
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.callButtonText}>Call Provider</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {(status === 'pending' || status === 'accepted') && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isCancelling}
        >
          {isCancelling ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <>
              <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
              <Text style={styles.cancelButtonText}>Cancel Request</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/*{status === 'accepted' && (
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
                Confirm Provider Arrived
              </Text>
            </>
          )}
        </TouchableOpacity>
      )} */}

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
