import { Ionicons } from '@expo/vector-icons';
import {
  EmergencyTrackingHeader,
  EmergencyTrackingMap,
  EmergencyTrackingStatusCardProvider,
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

import * as Location from 'expo-location';
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
import { useGetEmergencyRequest } from '@/services/emergency/emergency.api';
import { fetchRoute } from '@/services/maps/maps.api';
import { socketManager } from '@/socket/socket-manager';
import { useProviderStore } from '@/store/providerStore';
import { useSocketStore } from '@/store/socketStore';
import { EmergencyStatus } from '@/types/emergency.types';
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
} as const;

export default function ProviderEmergencyTrackingScreen() {
  const router = useRouter();
  const { requestId, emergencyType } = useLocalSearchParams<{
    requestId: string;
    emergencyType: string;
  }>();

  const mapRef = useRef<MapView>(null);
  const locationBroadcastTimer = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const simulationProgressRef = useRef(0);
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const isSimulatingRef = useRef<boolean>(false);

  const isProvider = true;
  const provider = useProviderStore(s => s.provider);
  const didProviderConnectRef = useRef<string | null>(null);

  const [userLocation, setUserLocation] = useState<LocationCoords>(TEST_CORDS);
  const [myLocation, setMyLocation] = useState<LocationCoords | null>(null);
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
    EmergencyStatus.ACCEPTED
  );
  const [isConfirmingArrival, setIsConfirmingArrival] = useState(false);
  const [, setIsProcessingConfirmation] = useState(false);

  const { socket, isConnected } = useSocketStore();
  const pulseAnim = usePulseAnimation(localStatus);
  const currentStatus = localStatus;

  //  Connect provider to request
  useEffect(() => {
    if (!requestId || !provider?.id || !isConnected) return;
    if (didProviderConnectRef.current === requestId) return;
    didProviderConnectRef.current = requestId;
    socketManager.emit(SocketEvents.PROVIDER_CONNECT, {
      requestId,
      providerId: provider.id,
    });
  }, [requestId, provider?.id, isConnected]);

  //  Fetch request
  const { data: requestData, isLoading: isLoadingRequest } =
    useGetEmergencyRequest(requestId || '', !!requestId);
  const emergencyRequest = requestData?.data?.data;

  useEffect(() => {
    if (emergencyRequest?.status) {
      setLocalStatus(emergencyRequest.status as EmergencyStatus);
    }
  }, [emergencyRequest?.status]);

  //  Route origin / destination
  const routeOrigin = useMemo(() => {
    if (!myLocation) return null;
    return { lat: myLocation.latitude, lng: myLocation.longitude };
  }, [myLocation]);

  const routeDestination = useMemo(
    () => ({ lat: userLocation.latitude, lng: userLocation.longitude }),
    [userLocation]
  );

  //  Route fetcher
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
    movingParty: myLocation,
    userLocation,
    routeCoordinates,
    currentStatus,
    setRemainingRouteCoordinates,
  });

  //  trigger route fetch whenever origin changes (provider moves)
  useEffect(() => {
    if (
      currentStatus !== EmergencyStatus.ACCEPTED &&
      currentStatus !== EmergencyStatus.IN_PROGRESS
    )
      return;
    if (!routeOrigin || !routeDestination) return;
    fetchAndUpdateRoute();
  }, [currentStatus, routeOrigin, routeDestination, fetchAndUpdateRoute]);

  //  gps location tracking
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required for tracking.'
        );
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const initial = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };
      setMyLocation(initial);
      setProviderLocation(initial);

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: LOCATION_TRACKING.LOCATION_UPDATE_INTERVAL,
          distanceInterval: LOCATION_TRACKING.LOCATION_DISTANCE_INTERVAL,
        },
        loc => {
          const updated = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setMyLocation(updated);
          setProviderLocation(updated);
        }
      );
    };

    startTracking();
    return () => {
      locationSubscription?.remove();
    };
  }, []);

  //  Broadcast location via socket
  useEffect(() => {
    if (!requestId || !myLocation) return;

    const broadcast = () => {
      if (!socket || !isConnected) return;
      socketManager.emit(SocketEvents.LOCATION_UPDATE, {
        requestId,
        providerId: socket.id,
        location: { lat: myLocation.latitude, lng: myLocation.longitude },
        timestamp: Date.now(),
        isProvider: true,
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

  //  Socket listeners
  const handleRemoveIncomingRequest = useCallback((reqId: string) => {
    const store = useProviderStore.getState();
    store.removeIncomingRequest(reqId);
    store.setCurrentRequest(null);
    store.setServiceStatus('available');
  }, []);

  const { setupSocketListeners } = useEmergencySocketHandlers({
    requestId: requestId || '',
    isProvider,
    socketId: socket?.id,
    socketManager,
    socketEvents,
    mapboxToLatLng,
    onProviderLocationUpdate: setProviderLocation,
    onUserLocationUpdate: setUserLocation,
    onProviderAccepted: () => setLocalStatus(EmergencyStatus.ACCEPTED),
    onEmergencyCompleted: () => setIsProcessingConfirmation(false),
    onRouteCoordinatesUpdate: setRouteCoordinates,
    onRouteInfoUpdate: setRouteInfo,
    onRemoveIncomingRequest: handleRemoveIncomingRequest,
    navigateAfterExit: () => router.replace('/(provider)/dashboard'),
    buildAssignedProvider: (data: any) => data.provider,
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

    console.log('[SIMULATION] Provider: starting');
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
        console.log('[SIMULATION] Provider: reached destination');
        setRemainingRouteCoordinates([]);
        return;
      }

      const newLocation = getPointAtProgress(
        routeCoordinates,
        simulationProgressRef.current
      );
      if (newLocation) {
        setMyLocation(newLocation);
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
        return STATUS_MESSAGES.acceptedProvider;
      case EmergencyStatus.IN_PROGRESS:
        return STATUS_MESSAGES.in_progress;
      case EmergencyStatus.COMPLETED:
        return STATUS_MESSAGES.completed;
      default:
        return STATUS_MESSAGES.pending;
    }
  }, [currentStatus]);

  const { confirmArrival } = useEmergencyActions();
  const handleConfirmArrival = () => {
    Alert.alert('Confirm Arrival', 'Have you arrived at the location?', [
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
    ]);
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
      <EmergencyTrackingHeader onBack={() => router.back()} />

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
        nearbyProviders={[]}
        remainingRouteCoordinates={remainingRouteCoordinates}
        emergencyInfo={emergencyInfo}
      />

      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenterMap}
      >
        <Ionicons name="locate" size={24} color="#374151" />
      </TouchableOpacity>

      <EmergencyTrackingStatusCardProvider
        emergencyInfo={emergencyInfo}
        statusMessage={getStatusMessage()}
        status={currentStatus}
        pulseAnim={pulseAnim}
        routeInfo={routeInfo ?? null}
        isLoadingRoute={isLoadingRoute}
        isConfirmingArrival={isConfirmingArrival}
        isConnected={isConnected}
        onConfirmArrival={handleConfirmArrival}
      />
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
    top: 60,
    right: 16,
    width: 44,
    height: 44,
    backgroundColor: COLORS.OFF_WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.LIGHT_GRAY,
  },
});
