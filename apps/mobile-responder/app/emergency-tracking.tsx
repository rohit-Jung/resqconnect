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
import { usePulseAnimation } from '@repo/mobile/emergency-tracking/hooks';

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
import { useSocketHandlers } from '@/hooks/useSocketHandlers';
import { useEmergencyActions } from '@/services/emergency/emergency.actions';
import { useGetEmergencyRequest } from '@/services/emergency/emergency.api';
import { fetchRoute } from '@/services/maps/maps.api';
import { socketManager } from '@/socket/socket-manager';
import { useProviderStore } from '@/store/providerStore';
import { useSocketStore } from '@/store/socketStore';
import { EmergencyStatus } from '@/types/emergency.types';
import {
  getRemainingRouteAfterProgress,
  haversineDistance,
  mapboxToLatLng,
} from '@/utils/location.utils';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function EmergencyTrackingScreen() {
  const router = useRouter();
  const { requestId, emergencyType } = useLocalSearchParams<{
    requestId: string;
    emergencyType: string;
  }>();

  const mapRef = useRef<MapView>(null);
  const lastRouteFetchLocation = useRef<LocationCoords | null>(null);
  const locationBroadcastTimer = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const isRouteRefetchingRef = useRef(false);
  const simulationProgressRef = useRef(0);

  const isSimulatingRef = useRef<boolean>(false);

  const isProvider = true;
  const provider = useProviderStore(s => s.provider);
  const didProviderConnectRef = useRef<string | null>(null);
  const initialUserLocation = TEST_CORDS;

  const [userLocation, setUserLocation] =
    useState<LocationCoords>(initialUserLocation);
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

  const [isConfirmingArrival, setIsConfirmingArrival] =
    useState<boolean>(false);

  const [, setIsProcessingConfirmation] = useState(false);

  const { socket, isConnected } = useSocketStore();
  const pulseAnim = usePulseAnimation(localStatus);

  // Provider must connect to the request so backend sets providerConnectedAt
  // and the disconnection worker doesn't rebroadcast the same request.
  useEffect(() => {
    if (!isProvider) return;
    if (!requestId) return;
    if (!provider?.id) return;
    if (!isConnected) return;

    if (didProviderConnectRef.current === requestId) return;
    didProviderConnectRef.current = requestId;

    socketManager.emit(SocketEvents.PROVIDER_CONNECT, {
      requestId,
      providerId: provider.id,
    });
  }, [isProvider, requestId, provider?.id, isConnected]);

  // Fetch emergency request status
  const { data: requestData, isLoading: isLoadingRequest } =
    useGetEmergencyRequest(requestId || '', !!requestId);

  const emergencyRequest = requestData?.data?.data;

  // Use local status that can be updated from socket events
  const currentStatus = localStatus;

  // Get status message based on current status and role
  const getStatusMessage = useCallback(() => {
    switch (currentStatus) {
      case EmergencyStatus.PENDING:
        return STATUS_MESSAGES.pending;
      case EmergencyStatus.ACCEPTED:
        return isProvider
          ? STATUS_MESSAGES.acceptedProvider
          : STATUS_MESSAGES.acceptedUser;
      case EmergencyStatus.IN_PROGRESS:
        return STATUS_MESSAGES.in_progress;
      case EmergencyStatus.COMPLETED:
        return STATUS_MESSAGES.completed;
      default:
        return STATUS_MESSAGES.pending;
    }
  }, [currentStatus, isProvider]);

  // Sync local status with server data on initial load
  useEffect(() => {
    if (emergencyRequest?.status) {
      setLocalStatus(emergencyRequest.status as EmergencyStatus);
    }
  }, [emergencyRequest?.status]);

  // Calculate origin and destination for route
  const routeOrigin = useMemo(() => {
    if (isProvider && myLocation) {
      return { lat: myLocation.latitude, lng: myLocation.longitude };
    }
    if (!isProvider && providerLocation) {
      return {
        lat: providerLocation.latitude,
        lng: providerLocation.longitude,
      };
    }
    return null;
  }, [isProvider, myLocation, providerLocation]);

  const routeDestination = useMemo(() => {
    return { lat: userLocation.latitude, lng: userLocation.longitude };
  }, [userLocation]);

  // Fetch route function
  const fetchAndUpdateRoute = useCallback(async () => {
    if (!routeOrigin || !routeDestination || isRouteRefetchingRef.current)
      return;
    if (isSimulatingRef.current) return;

    // Check if we need to refetch (significant movement)
    if (lastRouteFetchLocation.current) {
      const moved = haversineDistance(
        lastRouteFetchLocation.current.latitude,
        lastRouteFetchLocation.current.longitude,
        routeOrigin.lat,
        routeOrigin.lng
      );
      if (moved < LOCATION_TRACKING.ROUTE_REFETCH_THRESHOLD) {
        return; // Don't refetch, movement too small
      }
    }

    isRouteRefetchingRef.current = true;
    setIsLoadingRoute(true);

    try {
      const route = await fetchRoute({
        origin: routeOrigin,
        dest: routeDestination,
      });

      if (route) {
        const coords = mapboxToLatLng(route.coordinates);
        setRouteCoordinates(coords);
        // Initialize remaining route with full route
        setRemainingRouteCoordinates(coords);
        // Reset simulation progress when new route is loaded
        simulationProgressRef.current = 0;
        setRouteInfo({
          distance: route.distance,
          duration: route.duration,
        });
        lastRouteFetchLocation.current = {
          latitude: routeOrigin.lat,
          longitude: routeOrigin.lng,
        };
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    } finally {
      setIsLoadingRoute(false);
      isRouteRefetchingRef.current = false;
    }
  }, [routeOrigin, routeDestination]);

  // Pulse animation is now handled by usePulseAnimation hook
  // No need for separate useEffect

  // Simulated location movement along route (for testing only)
  // Enable with EXPO_PUBLIC_TEST_MODE=true in .env
  // useEffect(() => {
  //   const isTestMode = process.env.EXPO_PUBLIC_TEST_MODE === 'true';
  //   console.log("Is test Mode", isTestMode)
  //
  //   // Only enable in test mode when we have a route and emergency is active
  //   if (
  //     !isTestMode ||
  //     !routeCoordinates.length ||
  //     currentStatus !== EmergencyStatus.ACCEPTED ||
  //     !isProvider
  //   ) {
  //     return;
  //   }
  //
  //   console.log(
  //     '[SIMULATION] Starting simulated location movement along route'
  //   );
  //
  //   isSimulatingRef.current = true;
  //
  //   // Start simulation
  //   simulationTimerRef.current = setInterval(() => {
  //     simulationProgressRef.current += LOCATION_TRACKING.SIMULATION_INCREMENT;
  //
  //     // Stop when reached destination
  //     if (simulationProgressRef.current >= 1) {
  //       simulationProgressRef.current = 1;
  //       if (simulationTimerRef.current) {
  //         clearInterval(simulationTimerRef.current);
  //         isSimulatingRef.current = false;
  //         simulationTimerRef.current = null;
  //       }
  //       console.log('[SIMULATION] Reached destination');
  //       // Clear remaining route when destination reached
  //       setRemainingRouteCoordinates([]);
  //       return;
  //     }
  //
  //     // Calculate new location along route
  //     const newLocation = getPointAtProgress(
  //       routeCoordinates,
  //       simulationProgressRef.current
  //     );
  //
  //     if (newLocation) {
  //       console.log(
  //         `[SIMULATION] Simulated location progress: ${(
  //           simulationProgressRef.current * 100
  //         ).toFixed(1)}%`,
  //         newLocation
  //       );
  //
  //       // Update provider's location for real-time display
  //       setMyLocation(newLocation);
  //       setProviderLocation(newLocation);
  //
  //       // Update remaining route (polyline trimming)
  //       const remaining = getRemainingRouteAfterProgress(
  //         routeCoordinates,
  //         simulationProgressRef.current
  //       );
  //       console.log('Remaining', remaining);
  //       setRemainingRouteCoordinates(remaining);
  //     }
  //   }, LOCATION_TRACKING.SIMULATION_INTERVAL);
  //
  //   return () => {
  //     if (simulationTimerRef.current) {
  //       clearInterval(simulationTimerRef.current);
  //       isSimulatingRef.current = false;
  //       simulationTimerRef.current = null;
  //     }
  //   };
  // }, [routeCoordinates, currentStatus, isProvider]);

  // Start location tracking
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required for tracking.'
        );
        return;
      }

      if (isProvider) {
        // PROVIDER: Use real GPS location with continuous updates
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const initialLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        setMyLocation(initialLocation);
        setProviderLocation(initialLocation);

        // Subscribe to continuous location updates for provider
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: LOCATION_TRACKING.LOCATION_UPDATE_INTERVAL,
            distanceInterval: LOCATION_TRACKING.LOCATION_DISTANCE_INTERVAL,
          },
          location => {
            const newLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setMyLocation(newLocation);
            setProviderLocation(newLocation);
          }
        );
      } else {
        // USER: Use test coordinates only (for testing)
        setMyLocation(TEST_CORDS);
        // Note: userLocation is already initialized with TEST_CORDS
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isProvider]);

  // Broadcast location updates via socket
  useEffect(() => {
    if (!requestId || !myLocation) return;

    const broadcastLocation = () => {
      if (socket && isConnected && myLocation) {
        socketManager.emit(SocketEvents.LOCATION_UPDATE, {
          requestId,
          providerId: isProvider ? socket.id : undefined,
          userId: !isProvider ? socket.id : undefined,
          location: {
            lat: myLocation.latitude,
            lng: myLocation.longitude,
          },
          timestamp: Date.now(),
          isProvider,
        });
      }
    };

    // Broadcast immediately
    broadcastLocation();

    // Set up interval for periodic broadcasts
    locationBroadcastTimer.current = setInterval(
      broadcastLocation,
      LOCATION_TRACKING.LOCATION_BROADCAST_INTERVAL
    );

    return () => {
      if (locationBroadcastTimer.current) {
        clearInterval(locationBroadcastTimer.current);
      }
    };
  }, [requestId, myLocation, socket, isConnected, isProvider]);

  // Socket listeners for real-time updates
  const { setupSocketListeners } = useSocketHandlers({
    requestId: requestId || '',
    isProvider,
    socket,
    onProviderLocationUpdate: setProviderLocation,
    onUserLocationUpdate: setUserLocation,
    onProviderAccepted: () => {
      setLocalStatus(EmergencyStatus.ACCEPTED);
    },
    onEmergencyCompleted: () => {
      setIsProcessingConfirmation(false);
    },
    onRouteCoordinatesUpdate: setRouteCoordinates,
    onRouteInfoUpdate: setRouteInfo,
  });

  useEffect(() => {
    if (!requestId) return;
    const cleanup = setupSocketListeners();
    return cleanup;
  }, [requestId, setupSocketListeners]);

  // Update remaining route when my location changes (real-time polyline trimming for provider)
  useEffect(() => {
    if (
      isProvider &&
      myLocation &&
      routeCoordinates.length > 0 &&
      currentStatus === EmergencyStatus.ACCEPTED
    ) {
      // Find the closest point on the route to current location
      let minDist = Infinity;
      let closestIndex = 0;

      for (let i = 0; i < routeCoordinates.length; i++) {
        const dist = haversineDistance(
          myLocation.latitude,
          myLocation.longitude,
          routeCoordinates[i].latitude,
          routeCoordinates[i].longitude
        );
        if (dist < minDist) {
          minDist = dist;
          closestIndex = i;
        }
      }

      // Calculate progress based on closest point
      const progress = closestIndex / (routeCoordinates.length - 1);
      const remaining = getRemainingRouteAfterProgress(
        routeCoordinates,
        progress
      );
      setRemainingRouteCoordinates(remaining);
    }
  }, [myLocation, routeCoordinates, isProvider, currentStatus]);

  // Fetch route when status changes or when locations become available
  // For user: Only fetch if route wasn't already set from acceptance event
  useEffect(() => {
    if (
      currentStatus === EmergencyStatus.ACCEPTED ||
      currentStatus === EmergencyStatus.IN_PROGRESS
    ) {
      // Only fetch if we have the required locations AND route is not already set
      if (routeOrigin && routeDestination) {
        // For user: If we don't have route coordinates yet, fetch them
        // For provider: Always try to fetch/update route based on current position
        if (isProvider || routeCoordinates.length === 0) {
          console.log('Fetching route:', {
            routeOrigin,
            routeDestination,
            currentStatus,
            hasExistingRoute: routeCoordinates.length > 0,
          });
          fetchAndUpdateRoute();
        }
      } else {
        console.log('Cannot fetch route - missing locations:', {
          hasOrigin: !!routeOrigin,
          hasDest: !!routeDestination,
          isProvider,
          myLocation,
          providerLocation,
        });
      }
    }
  }, [
    currentStatus,
    routeOrigin,
    routeDestination,
    fetchAndUpdateRoute,
    isProvider,
    myLocation,
    providerLocation,
    routeCoordinates.length,
  ]);

  const { confirmArrival } = useEmergencyActions();
  const handleConfirmArrival = () => {
    Alert.alert('Confirm Arrival', 'Have you arrived to the location ?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Arrived',
        onPress: async () => {
          if (!requestId) {
            Alert.alert(
              'Sorry Request ID is not found!',
              'Simply exit the screen. Thank you for your patience.'
            );
            return;
          }

          // Mark confirmation as in progress to prevent accidental navigation
          setIsProcessingConfirmation(true);
          setIsConfirmingArrival(true);

          // mark confirmation as in progress to prevent accidental navigation
          setIsProcessingConfirmation(true);
          setIsConfirmingArrival(true);

          try {
            await confirmArrival(requestId);
          } catch {
            Alert.alert('Error', 'Failed to confirm  arrival');
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
  const statusInfo = getStatusMessage();

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
        statusMessage={statusInfo}
        status={currentStatus}
        pulseAnim={pulseAnim}
        routeInfo={
          routeInfo
            ? {
                distance: routeInfo.distance,
                duration: routeInfo.duration,
              }
            : null
        }
        isLoadingRoute={isLoadingRoute}
        isConfirmingArrival={isConfirmingArrival}
        isConnected={isConnected}
        onConfirmArrival={handleConfirmArrival}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.OFF_WHITE,
  },
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
  // Header, map markers, and status card styles live in the shared package.
});
