import { Ionicons } from '@expo/vector-icons';

import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Vibration } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { SocketEvents } from '@/constants/socket.constants';
import { TEST_CORDS } from '@/constants/test.constants';
import { newEmergencyEventPayloadSchema } from '@/lib/validations/socket';
import { serviceProviderApi } from '@/services/provider/provider.api';
import { socketManager } from '@/socket/socket-manager';
import { IncomingRequest, useProviderStore } from '@/store/providerStore';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const BLACK = '#000000';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const WARNING_AMBER = '#F59E0B';
const SUCCESS_GREEN = '#10B981';

const STATUS_COLORS = {
  available: SUCCESS_GREEN,
  assigned: WARNING_AMBER,
  off_duty: MID_GRAY,
};

const STATUS_LABELS = {
  available: 'AVAILABLE',
  assigned: 'ON DUTY',
  off_duty: 'OFF DUTY',
};

const EMERGENCY_TYPES = ['ambulance', 'police', 'fire_truck', 'rescue_team'];

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function ProviderDashboardScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const {
    provider,
    serviceStatus,
    setServiceStatus,
    incomingRequests,
    currentRequest,
    setCurrentRequest,
    removeIncomingRequest,
    addIncomingRequest,
  } = useProviderStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(
    null
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLoadingLocation(false);
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.log('Error getting location:', error);
      } finally {
        setIsLoadingLocation(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (incomingRequests.length > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [incomingRequests.length, pulseAnim]);

  useLayoutEffect(() => {
    console.log('Dashboard mounting - attaching socket listeners');

    const handleNewEmergency = (data: any) => {
      const parsedData = newEmergencyEventPayloadSchema.safeParse(data);
      if (!parsedData.success) return;

      // Vibrate on incoming request
      Vibration.vibrate([0, 500, 200, 500, 200, 500]);

      const requestData = {
        ...parsedData.data,
        location: parsedData.data.emergencyLocation,
        description: parsedData.data.emergencyDescription,
      };
      addIncomingRequest(requestData);
    };

    const handleRequestTaken = (data: any) => {
      if (data.providerId === provider?.id) return;
      removeIncomingRequest(data.requestId);
      if (currentRequest?.requestId === data.requestId) {
        setCurrentRequest(null);
      }
    };

    const handleRequestCancelled = (data: any) => {
      removeIncomingRequest(data.requestId);
      if (currentRequest?.requestId === data.requestId) {
        setCurrentRequest(null);
      }
    };

    const handleRequestCompleted = (data: any) => {
      console.log('Request completed event received:', data);
      // Remove from incoming requests
      removeIncomingRequest(data.requestId);
      // Clear current request if it's the completed one
      if (currentRequest?.requestId === data.requestId) {
        setCurrentRequest(null);
      }
      // Update provider status to available
      setServiceStatus('available');
    };

    socketManager.on(SocketEvents.NEW_EMERGENCY, handleNewEmergency);
    socketManager.on(SocketEvents.REQUEST_ACCEPTED, handleRequestTaken);
    socketManager.on(SocketEvents.REQUEST_CANCELLED, handleRequestCancelled);
    socketManager.on(SocketEvents.REQUEST_COMPLETED, handleRequestCompleted);

    console.log(
      `Socket listeners attached - NEW_EMERGENCY, REQUEST_ACCEPTED, REQUEST_CANCELLED, REQUEST_COMPLETED`
    );

    return () => {
      console.log('Dashboard unmounting - detaching socket listeners');
      socketManager.off(SocketEvents.NEW_EMERGENCY, handleNewEmergency);
      socketManager.off(SocketEvents.REQUEST_ACCEPTED, handleRequestTaken);
      socketManager.off(SocketEvents.REQUEST_CANCELLED, handleRequestCancelled);
      socketManager.off(SocketEvents.REQUEST_COMPLETED, handleRequestCompleted);
    };
  }, [
    addIncomingRequest,
    currentRequest,
    incomingRequests,
    provider?.id,
    removeIncomingRequest,
    serviceStatus,
    setCurrentRequest,
    setServiceStatus,
  ]);

  useEffect(() => {
    console.log('currentRequest changed:', currentRequest);
  }, [currentRequest]);

  const handleStatusChange = async (
    newStatus: 'available' | 'assigned' | 'off_duty'
  ) => {
    if (newStatus === serviceStatus) return;

    try {
      setIsLoading(true);
      await serviceProviderApi.updateStatus(newStatus);
      setServiceStatus(newStatus);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to update status'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (request: IncomingRequest) => {
    try {
      setIsAccepting(true);
      const response = await serviceProviderApi.acceptRequest(
        request.requestId
      );

      if (response.requestId !== request.requestId) {
        console.log("[ERROR]: Didn't match the id");
        return;
      }

      setCurrentRequest(request);
      console.log('SETTING current request successful');
      removeIncomingRequest(request.requestId);
      setServiceStatus('assigned');

      console.log(currentRequest);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to accept request'
      );
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectRequest = (request: IncomingRequest) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => removeIncomingRequest(request.requestId),
        },
      ]
    );
  };

  const handleMapsNavigation = () => {
    if (!currentRequest) {
      Alert.alert('Current Request not found');
      return;
    }

    const lat = currentRequest.location.latitude;
    const lng = currentRequest.location.longitude;

    // FIX: OPEN GOOGLE MAPS
    // const url = `https://maps.google.com/?q=${lat},${lng}`;
    // Linking.openURL(url);

    // OPEN IN APP
    router.push({
      pathname: '/emergency-tracking',
      params: {
        requestId: currentRequest.requestId,
        emergencyType: currentRequest.emergencyType,
        role: 'provider',
      },
    });
  };

  const isConnected = socketManager.isConnected();

  const emitPeriodicLocation = useCallback(async () => {
    if (serviceStatus !== 'available' || !currentLocation) {
      return;
    }

    try {
      socketManager.emit(SocketEvents.PROVIDER_PERIODIC_LOCATION, {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        serviceStatus,
      });
    } catch (error) {
      console.log('Error emitting periodic location:', error);
    }
  }, [currentLocation, serviceStatus]);

  // TODO: Re-enable periodic location updates after testing
  // For testing, we're using simulated location updates from route in emergency-tracking.tsx
  // useEffect(() => {
  //   if (serviceStatus !== 'available' || !currentLocation) {
  //     return;
  //   }
  //
  //   emitPeriodicLocation();
  //
  //   const intervalId = setInterval(() => {
  //     emitPeriodicLocation();
  //   }, 10000);
  //
  //   return () => clearInterval(intervalId);
  // }, [serviceStatus, currentLocation, emitPeriodicLocation]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <View style={styles.brandRow}>
              <Text style={styles.brandMark}>RESQ</Text>
              <Text style={styles.brandDot}>.</Text>
            </View>
            <View style={styles.headerLine} />
            <Text style={styles.tagline}>RESPONDER DASHBOARD</Text>
          </View>
          <View style={styles.headerRight}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: isConnected ? SUCCESS_GREEN : SIGNAL_RED },
              ]}
            />
            <TouchableOpacity
              onPress={() => router.push('/(provider)/profile')}
              style={styles.profileButton}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={20} color={OFF_WHITE} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.providerInfo}>
          <Text style={styles.providerLabel}>ACTIVE RESPONDER</Text>
          <Text style={styles.providerName}>
            {provider?.name || 'Responder'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Location Map */}
        <View style={styles.mapSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR LOCATION</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.mapContainer}>
            {isLoadingLocation ? (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="small" color={MID_GRAY} />
                <Text style={styles.mapLoadingText}>
                  Getting your location...
                </Text>
              </View>
            ) : currentLocation ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={false}
                scrollEnabled={true}
                zoomEnabled={true}
              >
                <Marker
                  coordinate={currentLocation}
                  title="Your Location"
                  description="You are here"
                  pinColor={SUCCESS_GREEN}
                />
              </MapView>
            ) : (
              <View style={styles.mapError}>
                <Ionicons name="location-outline" size={32} color={MID_GRAY} />
                <Text style={styles.mapErrorText}>Location unavailable</Text>
              </View>
            )}
          </View>

          {currentLocation && (
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>
                {currentLocation.latitude.toFixed(6)},{' '}
                {currentLocation.longitude.toFixed(6)}
              </Text>
              <TouchableOpacity
                style={styles.refreshLocationButton}
                onPress={async () => {
                  setIsLoadingLocation(true);
                  try {
                    const location = await Location.getCurrentPositionAsync({
                      accuracy: Location.Accuracy.High,
                    });
                    setCurrentLocation({
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    });
                    mapRef.current?.animateToRegion({
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    });
                  } catch (error) {
                    console.log('Error refreshing location:', error);
                  } finally {
                    setIsLoadingLocation(false);
                  }
                }}
                disabled={isLoadingLocation}
              >
                <Ionicons name="refresh" size={16} color={MID_GRAY} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Status Selector */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR STATUS</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.statusSelector}>
            {(
              Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>
            ).map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusButton,
                  serviceStatus === status && styles.statusButtonActive,
                  {
                    borderColor:
                      serviceStatus === status
                        ? STATUS_COLORS[status]
                        : LIGHT_GRAY,
                  },
                ]}
                onPress={() => handleStatusChange(status)}
                disabled={
                  isLoading || (status === 'assigned' && !currentRequest)
                }
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: STATUS_COLORS[status] },
                  ]}
                />
                <Text
                  style={[
                    styles.statusLabel,
                    serviceStatus === status && {
                      color: STATUS_COLORS[status],
                    },
                  ]}
                >
                  {STATUS_LABELS[status]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Current Assignment */}
        {currentRequest && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>CURRENT ASSIGNMENT</Text>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.assignmentCard}>
              <View style={styles.assignmentHeader}>
                <View
                  style={[
                    styles.emergencyBadge,
                    { backgroundColor: WARNING_AMBER },
                  ]}
                >
                  <Text style={styles.emergencyBadgeText}>
                    {currentRequest.emergencyType.toUpperCase()}
                  </Text>
                </View>
                {currentRequest.description && (
                  <Text style={styles.assignmentDescription}>
                    {currentRequest.description}
                  </Text>
                )}
              </View>

              <View style={styles.assignmentActions}>
                <TouchableOpacity
                  style={styles.assignmentButton}
                  onPress={handleMapsNavigation}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="navigate-outline"
                    size={18}
                    color={OFF_WHITE}
                  />
                  <Text style={styles.assignmentButtonText}>NAVIGATE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.assignmentButton, styles.completeButton]}
                  onPress={() => {
                    setCurrentRequest(null);
                    setServiceStatus('available');
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="checkmark" size={18} color={OFF_WHITE} />
                  <Text style={styles.assignmentButtonText}>COMPLETE</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Incoming Requests */}
        {incomingRequests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                INCOMING REQUESTS ({incomingRequests.length})
              </Text>
              <View style={styles.sectionLine} />
            </View>

            {incomingRequests.map(request => (
              <Animated.View
                key={request.requestId}
                style={[
                  styles.requestCard,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={styles.requestHeader}>
                  <View
                    style={[
                      styles.emergencyBadge,
                      { backgroundColor: SIGNAL_RED },
                    ]}
                  >
                    <Text style={styles.emergencyBadgeText}>
                      {request.emergencyType.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.requestTime}>
                    {new Date().toLocaleTimeString()}
                  </Text>
                </View>

                {request.description && (
                  <Text style={styles.requestDescription}>
                    {request.description}
                  </Text>
                )}

                <View style={styles.requestActions}>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRequest(request)}
                    disabled={isAccepting}
                    activeOpacity={0.7}
                  >
                    {isAccepting ? (
                      <ActivityIndicator color={OFF_WHITE} size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark"
                          size={18}
                          color={OFF_WHITE}
                        />
                        <Text style={styles.requestButtonText}>ACCEPT</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectRequest(request)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={18} color={OFF_WHITE} />
                    <Text style={styles.requestButtonText}>REJECT</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {serviceStatus === 'available' &&
          !currentRequest &&
          incomingRequests.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="radio-outline" size={48} color={LIGHT_GRAY} />
              </View>
              <Text style={styles.emptyTitle}>LISTENING FOR EMERGENCIES</Text>
              <Text style={styles.emptyDescription}>
                You will be notified when an emergency request is received
                nearby
              </Text>
            </View>
          )}

        {serviceStatus === 'off_duty' && (
          <View style={styles.offDutyContainer}>
            <View style={styles.offDutyCard}>
              <View style={styles.offDutyIcon}>
                <Ionicons name="moon-outline" size={48} color={MID_GRAY} />
              </View>
              <Text style={styles.offDutyTitle}>YOU ARE OFF DUTY</Text>
              <Text style={styles.offDutyDescription}>
                Switch to Available to start receiving emergency requests
              </Text>
              <TouchableOpacity
                style={styles.goOnlineButton}
                onPress={() => handleStatusChange('available')}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color={OFF_WHITE} />
                ) : (
                  <>
                    <Ionicons
                      name="radio-button-on"
                      size={20}
                      color={OFF_WHITE}
                    />
                    <Text style={styles.goOnlineButtonText}>GO ONLINE</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
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
    alignItems: 'flex-start',
    marginBottom: 16,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    marginRight: 12,
  },
  profileButton: {
    padding: 8,
    backgroundColor: SIGNAL_RED,
  },
  providerInfo: {
    borderLeftWidth: 3,
    borderLeftColor: SIGNAL_RED,
    paddingLeft: 12,
  },
  providerLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
  },
  mapSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  mapContainer: {
    height: 200,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
  },
  mapLoadingText: {
    marginTop: 8,
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 1,
  },
  mapError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
  },
  mapErrorText: {
    marginTop: 8,
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 1,
  },
  locationText: {
    marginTop: 8,
    fontSize: 10,
    color: MID_GRAY,
    letterSpacing: 1,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  refreshLocationButton: {
    marginLeft: 8,
    padding: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
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
  statusSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: LIGHT_GRAY,
  },
  statusButtonActive: {
    backgroundColor: LIGHT_GRAY,
  },
  statusDot: {
    width: 8,
    height: 8,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 1,
  },
  assignmentCard: {
    borderWidth: 1,
    borderColor: WARNING_AMBER,
    padding: 16,
  },
  assignmentHeader: {
    marginBottom: 16,
  },
  emergencyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  emergencyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 1,
  },
  assignmentDescription: {
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 1,
    lineHeight: 18,
  },
  assignmentActions: {
    flexDirection: 'row',
  },
  assignmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    marginRight: 8,
  },
  completeButton: {
    backgroundColor: SUCCESS_GREEN,
    marginRight: 0,
    marginLeft: 0,
  },
  assignmentButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 1,
    marginLeft: 8,
  },
  requestCard: {
    borderWidth: 1,
    borderColor: SIGNAL_RED,
    padding: 16,
    marginBottom: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestTime: {
    fontSize: 10,
    color: MID_GRAY,
    letterSpacing: 1,
  },
  requestDescription: {
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 1,
    lineHeight: 18,
    marginBottom: 16,
  },
  requestActions: {
    flexDirection: 'row',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SUCCESS_GREEN,
    paddingVertical: 12,
    marginRight: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MID_GRAY,
    paddingVertical: 12,
    marginLeft: 8,
  },
  requestButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 1,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 2,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
  offDutyContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  offDutyCard: {
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    padding: 32,
    alignItems: 'center',
  },
  offDutyIcon: {
    marginBottom: 16,
  },
  offDutyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 2,
    marginBottom: 8,
  },
  offDutyDescription: {
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  goOnlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SUCCESS_GREEN,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  goOnlineButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 2,
    marginLeft: 8,
  },
});
