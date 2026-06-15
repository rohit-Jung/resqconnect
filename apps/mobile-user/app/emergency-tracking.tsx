import { Ionicons } from '@expo/vector-icons';
import {
  EmergencyTrackingHeader,
  EmergencyTrackingMap,
  EmergencyTrackingStatusCardUser,
  FeedbackCard,
} from '@repo/mobile/emergency-tracking/components';
import {
  COLORS,
  EMERGENCY_ICONS,
  LOCATION_TRACKING,
  MAP_CONFIG,
  STATUS_MESSAGES,
} from '@repo/mobile/emergency-tracking/constants';
import {
  useEmergencySocketHandlers,
  usePulseAnimation,
  useRemainingRoute,
  useRouteFetcher,
} from '@repo/mobile/emergency-tracking/hooks';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import MapView, { LatLng } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SocketEvents } from '@/constants/socket.constants';
import { TEST_CORDS } from '@/constants/test.constants';
import { useEmergencyActions } from '@/services/emergency/emergency.actions';
import {
  useGetEmergencyRequest,
  useGetNearbyProviders,
} from '@/services/emergency/emergency.api';
import { useCreateFeedback } from '@/services/feedback/feedback.api';
import { fetchRoute, useReverseGeocode } from '@/services/maps/maps.api';
import { socketManager } from '@/socket/socket-manager';
import { useSocketStore } from '@/store/socketStore';
import { EmergencyStatus, IAssignedProvider } from '@/types/emergency.types';
import { getPointAtProgress, mapboxToLatLng } from '@/utils/location.utils';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const socketEvents = {
  USER_JOIN_ROOM: SocketEvents.USER_JOIN_ROOM,
  PROVIDER_LOCATION_UPDATED: SocketEvents.PROVIDER_LOCATION_UPDATED,
  USER_LOCATION_UPDATED: SocketEvents.USER_LOCATION_UPDATED,
  REQUEST_ACCEPTED: SocketEvents.REQUEST_ACCEPTED,
  REQUEST_COMPLETED: SocketEvents.REQUEST_COMPLETED,
  REQUEST_CANCELLED: SocketEvents.REQUEST_CANCELLED,
  REQUEST_CANCELLED_NOTIFICATION: SocketEvents.REQUEST_CANCELLED_NOTIFICATION,
  PROVIDER_CONFIRM_ARRIVAL: SocketEvents.PROVIDER_CONFIRM_ARRIVAL,
  CANCEL_REQUEST: SocketEvents.CANCEL_REQUEST_SOCKET,
} as const;

export default function UserEmergencyTrackingScreen() {
  const router = useRouter();
  const { requestId, emergencyType, latitude, longitude } =
    useLocalSearchParams<{
      requestId: string;
      emergencyType: string;
      latitude: string;
      longitude: string;
    }>();

  const paramCoords: LocationCoords | null =
    latitude && longitude
      ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
      : null;

  const mapRef = useRef<MapView>(null);
  const locationBroadcastTimer = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const simulationProgressRef = useRef(0);
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const isSimulatingRef = useRef<boolean>(false);

  const isProvider = false;

  const [userLocation, setUserLocation] = useState<LocationCoords>(
    paramCoords ?? TEST_CORDS
  );
  const [myLocation, setMyLocation] = useState<LocationCoords | null>(
    paramCoords ?? TEST_CORDS
  );
  const [assignedProvider, setAssignedProvider] =
    useState<IAssignedProvider | null>(null);
  const [providerLocation, setProviderLocation] =
    useState<LocationCoords | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [remainingRouteCoordinates, setRemainingRouteCoordinates] = useState<
    LatLng[]
  >([]);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [localStatus, setLocalStatus] = useState<EmergencyStatus>(
    EmergencyStatus.PENDING
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [isConfirmingArrival, setIsConfirmingArrival] = useState(false);
  const [, setIsProcessingConfirmation] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const { socket, isConnected } = useSocketStore();
  const pulseAnim = usePulseAnimation(localStatus);
  const currentStatus = localStatus;

  const { data: userLocationAddress } = useReverseGeocode(
    userLocation.latitude,
    userLocation.longitude
  );

  //  fetch request
  const { data: requestData, isLoading: isLoadingRequest } =
    useGetEmergencyRequest(requestId || '', !!requestId);
  const emergencyRequest = requestData?.data?.data;

  const { data: providersData } = useGetNearbyProviders(
    {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      serviceType: emergencyType || 'ambulance',
    },
    Number.isFinite(userLocation.latitude) &&
      Number.isFinite(userLocation.longitude) &&
      !!emergencyType
  );

  const nearbyProviders = useMemo(
    () => providersData?.data?.providers || [],
    [providersData?.data?.providers]
  );

  useEffect(() => {
    if (emergencyRequest?.status) {
      setLocalStatus(emergencyRequest.status as EmergencyStatus);
    }
  }, [emergencyRequest?.status]);

  // show feedback card when emergency is completed
  useEffect(() => {
    if (
      localStatus === EmergencyStatus.COMPLETED &&
      !!assignedProvider &&
      !feedbackSubmitted
    ) {
      setShowFeedback(true);
    }
  }, [localStatus, assignedProvider, feedbackSubmitted]);

  //  route origin / destination
  const routeOrigin = useMemo(() => {
    if (!providerLocation) return null;
    return { lat: providerLocation.latitude, lng: providerLocation.longitude };
  }, [providerLocation]);

  const routeDestination = useMemo(
    () => ({ lat: userLocation.latitude, lng: userLocation.longitude }),
    [userLocation]
  );

  //  route fetcher
  const { fetchAndUpdateRoute } = useRouteFetcher({
    routeOrigin,
    routeDestination,
    userLocation,
    fetchRoute,
    isSimulatingRef,
    simulationProgressRef,
    setRouteCoordinates,
    setRemainingRouteCoordinates,
    setRouteInfo,
    setIsLoadingRoute,
  });

  //  polyline trimming
  useRemainingRoute({
    movingParty: providerLocation,
    userLocation,
    routeCoordinates,
    currentStatus,
    setRemainingRouteCoordinates,
  });

  //  trigger route fetch whenever providerlocation changes
  useEffect(() => {
    if (
      currentStatus !== EmergencyStatus.ACCEPTED &&
      currentStatus !== EmergencyStatus.IN_PROGRESS
    )
      return;
    if (!routeOrigin || !routeDestination) return;
    fetchAndUpdateRoute();
  }, [currentStatus, routeOrigin, routeDestination, fetchAndUpdateRoute]);

  //  broadcast user location via socket
  useEffect(() => {
    if (!requestId || !myLocation) return;

    const broadcast = () => {
      if (!socket || !isConnected) return;
      socketManager.emit(SocketEvents.LOCATION_UPDATE, {
        requestId,
        userId: socket.id,
        location: { lat: myLocation.latitude, lng: myLocation.longitude },
        timestamp: Date.now(),
        isProvider: false,
      });
    };

    broadcast();
    locationBroadcastTimer.current = setInterval(
      broadcast,
      LOCATION_TRACKING.LOCATION_BROADCAST_INTERVAL
    );
    return () => {
      if (locationBroadcastTimer.current)
        clearInterval(locationBroadcastTimer.current);
    };
  }, [requestId, myLocation, socket, isConnected]);

  //  socket listeners
  const buildAssignedProvider = useCallback(
    (data: any): IAssignedProvider => ({
      id: data.provider.id,
      name: data.provider.name,
      serviceType: data.provider.serviceType,
      currentLocation: data.provider.location,
      distance: 0,
      phoneNumber: data.provider.phone,
      vehicleNumber: data.provider.vehicleNumber,
      estimatedArrival: data.route?.duration,
    }),
    []
  );

  const { setupSocketListeners } =
    useEmergencySocketHandlers<IAssignedProvider>({
      requestId: requestId || '',
      isProvider,
      socketId: socket?.id,
      socketManager,
      socketEvents,
      mapboxToLatLng,
      onProviderLocationUpdate: setProviderLocation,
      onUserLocationUpdate: setUserLocation,
      onProviderAccepted: provider => {
        setLocalStatus(EmergencyStatus.ACCEPTED);
        setAssignedProvider(provider);
      },
      onEmergencyCompleted: () => setIsProcessingConfirmation(false),
      onRouteCoordinatesUpdate: setRouteCoordinates,
      onRouteInfoUpdate: setRouteInfo,
      navigateAfterExit: () => router.replace('/(tabs)'),
      buildAssignedProvider,
    });

  useEffect(() => {
    if (!requestId) return;
    return setupSocketListeners();
  }, [requestId, setupSocketListeners]);

  //  test-mode simulation
  useEffect(() => {
    const isTestMode = process.env.EXPO_PUBLIC_TEST_MODE === 'true';
    if (
      !isTestMode ||
      !routeCoordinates.length ||
      currentStatus !== EmergencyStatus.ACCEPTED
    )
      return;

    console.log('[SIMULATION] User: starting provider movement');
    isSimulatingRef.current = true;

    simulationTimerRef.current = setInterval(() => {
      simulationProgressRef.current += LOCATION_TRACKING.SIMULATION_INCREMENT;

      if (simulationProgressRef.current >= 1) {
        simulationProgressRef.current = 1;
        if (simulationTimerRef.current) {
          clearInterval(simulationTimerRef.current);
          simulationTimerRef.current = null;
          isSimulatingRef.current = false;
        }
        console.log('[SIMULATION] User: provider reached destination');
        setRemainingRouteCoordinates([]);
        return;
      }

      const newLocation = getPointAtProgress(
        routeCoordinates,
        simulationProgressRef.current
      );
      if (newLocation) {
        setProviderLocation(newLocation);
      }
    }, LOCATION_TRACKING.SIMULATION_INTERVAL);

    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
        isSimulatingRef.current = false;
      }
    };
  }, [routeCoordinates, currentStatus]);

  //  handlers
  const getStatusMessage = useCallback(() => {
    switch (currentStatus) {
      case EmergencyStatus.PENDING:
        return STATUS_MESSAGES.pending;
      case EmergencyStatus.ACCEPTED:
        return STATUS_MESSAGES.acceptedUser;
      case EmergencyStatus.IN_PROGRESS:
        return STATUS_MESSAGES.in_progress;
      case EmergencyStatus.COMPLETED:
        return STATUS_MESSAGES.completed;
      default:
        return STATUS_MESSAGES.pending;
    }
  }, [currentStatus]);

  const { cancelRequest, confirmArrival } = useEmergencyActions();
  const feedbackMutation = useCreateFeedback();

  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Emergency',
      'Are you sure you want to cancel this emergency request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRequest(requestId);
              Alert.alert(
                'Request Cancelled',
                'Your emergency request has been cancelled.',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
              );
            } catch {
              Alert.alert('Error', 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const handleConfirmArrival = () => {
    Alert.alert(
      'Confirm Arrival',
      'Has the service provider arrived at your location?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Arrived',
          onPress: async () => {
            if (!requestId) {
              Alert.alert(
                'Error',
                'Request ID not found. Please exit the screen.'
              );
              return;
            }
            setIsProcessingConfirmation(true);
            setIsConfirmingArrival(true);
            try {
              await confirmArrival(requestId);
            } catch {
              Alert.alert('Error', 'Failed to confirm arrival');
            } finally {
              setIsProcessingConfirmation(false);
              setIsConfirmingArrival(false);
            }
          },
        },
      ]
    );
  };

  const handleRecenterMap = () => {
    if (!mapRef.current) return;
    const coordinates: LocationCoords[] = [];
    if (
      Number.isFinite(userLocation.latitude) &&
      Number.isFinite(userLocation.longitude)
    ) {
      coordinates.push(userLocation);
    }
    if (
      providerLocation &&
      Number.isFinite(providerLocation.latitude) &&
      Number.isFinite(providerLocation.longitude)
    ) {
      coordinates.push(providerLocation);
    }
    if (coordinates.length > 1) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: MAP_CONFIG.FIT_TO_COORDINATES_PADDING,
        animated: true,
      });
    } else if (myLocation) {
      mapRef.current.animateToRegion({
        ...myLocation,
        latitudeDelta: MAP_CONFIG.RECENTER_DELTA.latitudeDelta,
        longitudeDelta: MAP_CONFIG.RECENTER_DELTA.longitudeDelta,
      });
    }
  };

  const handleFeedbackSubmit = useCallback(
    async (data: { message: string; serviceRatings: number }) => {
      if (!assignedProvider?.id || !requestId) return;
      await feedbackMutation.mutateAsync({
        serviceProviderId: assignedProvider.id,
        message: data.message,
        serviceRatings: data.serviceRatings,
      });
      setFeedbackSubmitted(true);
    },
    [assignedProvider, requestId, feedbackMutation]
  );

  const handleFeedbackSkip = useCallback(() => {
    setShowFeedback(false);
    router.replace('/(tabs)');
  }, [router]);

  //  render
  if (isLoadingRequest) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.SIGNAL_RED} />
        <Text style={styles.loadingText}>LOADING EMERGENCY DETAILS...</Text>
      </SafeAreaView>
    );
  }

  const emergencyKey =
    typeof emergencyType === 'string' && emergencyType in EMERGENCY_ICONS
      ? (emergencyType as keyof typeof EMERGENCY_ICONS)
      : 'ambulance';
  const emergencyInfo = EMERGENCY_ICONS[emergencyKey];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <EmergencyTrackingHeader onBack={() => router.replace('/(tabs)')} />

      <EmergencyTrackingMap
        mapRef={mapRef}
        mapReady={mapReady}
        onMapReady={() => setMapReady(true)}
        initialRegion={{
          ...userLocation,
          latitudeDelta: MAP_CONFIG.INITIAL_DELTA.latitudeDelta,
          longitudeDelta: MAP_CONFIG.INITIAL_DELTA.longitudeDelta,
        }}
        userLocation={userLocation}
        providerLocation={providerLocation}
        nearbyProviders={
          currentStatus === EmergencyStatus.PENDING ? nearbyProviders : []
        }
        remainingRouteCoordinates={remainingRouteCoordinates}
        emergencyInfo={emergencyInfo}
      />

      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenterMap}
      >
        <Ionicons name="locate" size={24} color="#374151" />
      </TouchableOpacity>

      {showFeedback && assignedProvider ? (
        <FeedbackCard
          providerName={assignedProvider.name}
          emergencyType={emergencyType || 'ambulance'}
          onSubmit={handleFeedbackSubmit}
          onSkip={handleFeedbackSkip}
        />
      ) : (
        <EmergencyTrackingStatusCardUser
          emergencyInfo={emergencyInfo}
          statusMessage={getStatusMessage()}
          status={currentStatus}
          pulseAnim={pulseAnim}
          routeInfo={routeInfo ?? null}
          isLoadingRoute={isLoadingRoute}
          nearbyProvidersCount={
            currentStatus === EmergencyStatus.PENDING
              ? nearbyProviders.length
              : 0
          }
          locationAddress={userLocationAddress ?? null}
          userLocation={userLocation}
          assignedProvider={
            assignedProvider
              ? {
                  name: assignedProvider.name,
                  vehicleNumber: assignedProvider.vehicleNumber,
                  phoneNumber: assignedProvider.phoneNumber,
                }
              : null
          }
          isCancelling={isCancelling}
          isConfirmingArrival={isConfirmingArrival}
          isConnected={isConnected}
          onCancel={handleCancelRequest}
          onConfirmArrival={handleConfirmArrival}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.OFF_WHITE },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.OFF_WHITE,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 12,
    color: COLORS.MID_GRAY,
    letterSpacing: 2,
  },
  recenterButton: {
    position: 'absolute',
    // sits below header (~56px) + 12px gap
    top: 68,
    right: 16,
    width: 42,
    height: 42,
    backgroundColor: COLORS.OFF_WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
});
