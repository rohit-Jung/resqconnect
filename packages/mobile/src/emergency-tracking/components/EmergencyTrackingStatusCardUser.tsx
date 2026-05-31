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
  locationAddress,
  userLocation,
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
  locationAddress?: string | null;
  userLocation?: { latitude: number; longitude: number };
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

  const isPending = status === 'pending';

  return (
    <View style={[styles.statusCard, isPending && styles.statusCardPending]}>
      {/* Type badge */}
      <View style={styles.topRow}>
        <View
          style={[styles.typeBadge, { backgroundColor: emergencyInfo.color }]}
        >
          <MaterialCommunityIcons
            name={emergencyInfo.icon as any}
            size={14}
            color="#fff"
          />
          <Text style={styles.typeBadgeText}>
            {emergencyInfo.label.toUpperCase()} EMERGENCY
          </Text>
        </View>
        <View style={styles.connectionPill}>
          <View
            style={[
              styles.connectionDot,
              { backgroundColor: isConnected ? COLORS.GREEN : COLORS.RED },
            ]}
          />
          <Text style={styles.connectionText}>
            {isConnected ? 'LIVE' : 'RECONNECTING'}
          </Text>
        </View>
      </View>

      {/* PENDING — search animation */}
      {isPending && (
        <View style={styles.pendingBody}>
          <View style={styles.pulseWrapper}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  borderColor: emergencyInfo.color,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <View
              style={[
                styles.pulseIconCenter,
                { backgroundColor: emergencyInfo.color },
              ]}
            >
              <MaterialCommunityIcons
                name={emergencyInfo.icon as any}
                size={28}
                color="#fff"
              />
            </View>
          </View>

          <Text style={[styles.pendingTitle, { color: emergencyInfo.color }]}>
            {statusMessage.message}
          </Text>

          {nearbyProvidersCount > 0 ? (
            <View style={styles.providersChip}>
              <Ionicons name="people" size={14} color={COLORS.GREEN} />
              <Text style={styles.providersChipText}>
                {nearbyProvidersCount} RESPONDER
                {nearbyProvidersCount > 1 ? 'S' : ''} NEARBY
              </Text>
            </View>
          ) : (
            <View style={styles.providersChip}>
              <ActivityIndicator size="small" color={COLORS.MID_GRAY} />
              <Text
                style={[styles.providersChipText, { color: COLORS.MID_GRAY }]}
              >
                SCANNING AREA...
              </Text>
            </View>
          )}

          {/* Location address strip */}
          <View style={styles.locationStrip}>
            <Ionicons name="location" size={13} color={COLORS.SIGNAL_RED} />
            <View style={styles.locationStripText}>
              {locationAddress ? (
                <Text style={styles.locationAddressText} numberOfLines={2}>
                  {locationAddress}
                </Text>
              ) : null}
              {userLocation ? (
                <Text style={styles.locationCoordsText}>
                  {userLocation.latitude.toFixed(5)},{' '}
                  {userLocation.longitude.toFixed(5)}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      )}

      {/* ACCEPTED / IN_PROGRESS — status row */}
      {!isPending && (
        <View style={styles.statusSection}>
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={statusMessage.color}
          />
          <Text style={[styles.statusText, { color: statusMessage.color }]}>
            {statusMessage.message}
          </Text>
        </View>
      )}

      {/* Location strip for non-pending */}
      {!isPending && (locationAddress || userLocation) && (
        <View style={[styles.locationStrip, { marginBottom: 10 }]}>
          <Ionicons name="location" size={13} color={COLORS.SIGNAL_RED} />
          <View style={styles.locationStripText}>
            {locationAddress ? (
              <Text style={styles.locationAddressText} numberOfLines={1}>
                {locationAddress}
              </Text>
            ) : null}
            {userLocation ? (
              <Text style={styles.locationCoordsText}>
                {userLocation.latitude.toFixed(5)},{' '}
                {userLocation.longitude.toFixed(5)}
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {/* Route info */}
      {!!routeInfo && (status === 'accepted' || status === 'in_progress') && (
        <View style={styles.routeInfoRow}>
          <View style={styles.routeInfoItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.MID_GRAY} />
            <Text style={styles.routeInfoValue}>{routeInfo.duration} min</Text>
            <Text style={styles.routeInfoLabel}>ETA</Text>
          </View>
          <View style={styles.routeInfoDivider} />
          <View style={styles.routeInfoItem}>
            <Ionicons
              name="navigate-outline"
              size={16}
              color={COLORS.MID_GRAY}
            />
            <Text style={styles.routeInfoValue}>{routeInfo.distance} km</Text>
            <Text style={styles.routeInfoLabel}>AWAY</Text>
          </View>
          {isLoadingRoute && (
            <ActivityIndicator
              size="small"
              color={COLORS.MID_GRAY}
              style={{ marginLeft: 12 }}
            />
          )}
        </View>
      )}

      {/* Assigned provider */}
      {!!assignedProvider && (
        <View style={styles.providerCard}>
          <View style={styles.providerAvatar}>
            <MaterialCommunityIcons name="account" size={18} color="#fff" />
          </View>
          <View style={styles.providerDetails}>
            <Text style={styles.providerName}>{assignedProvider.name}</Text>
            {!!assignedProvider.vehicleNumber && (
              <Text style={styles.providerVehicle}>
                {assignedProvider.vehicleNumber}
              </Text>
            )}
          </View>
          {!!assignedProvider.phoneNumber && (
            <TouchableOpacity style={styles.callBtn} onPress={onCallProvider}>
              <Ionicons name="call" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Cancel */}
      {(status === 'pending' || status === 'accepted') && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isCancelling}
          activeOpacity={0.8}
        >
          {isCancelling ? (
            <ActivityIndicator size="small" color={COLORS.SIGNAL_RED} />
          ) : (
            <>
              <Ionicons
                name="close-circle-outline"
                size={18}
                color={COLORS.SIGNAL_RED}
              />
              <Text style={styles.cancelButtonText}>CANCEL REQUEST</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
