import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, {
  LatLng,
  Marker,
  PROVIDER_GOOGLE,
  Polyline,
} from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  COLORS,
  EMERGENCY_ICONS,
  LOCATION_TRACKING,
  MAP_CONFIG,
  MARKER_SIZES,
  STATUS_MESSAGES,
  UI_CONFIG,
} from '@/constants/emergency-tracking.constants';
import { SocketEvents } from '@/constants/socket.constants';
import { TEST_CORDS } from '@/constants/test.constants';
import { usePulseAnimation } from '@/hooks/usePulseAnimation';
import { useSocketHandlers } from '@/hooks/useSocketHandlers';
import {
  useGetEmergencyRequest,
  useGetNearbyProviders,
} from '@/services/emergency/emergency.api';
import { fetchRoute } from '@/services/maps/maps.api';
import { socketManager } from '@/socket/socket-manager';
import { useProviderStore } from '@/store/providerStore';
import { useSocketStore } from '@/store/socketStore';
import { EmergencyStatus, IAssignedProvider } from '@/types/emergency.types';
import {
  formatDistance,
  formatDuration,
  getPointAtProgress,
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
  const {
    requestId,
    emergencyType,
    role = 'user',
  } = useLocalSearchParams<{
    requestId: string;
    emergencyType: string;
    role?: 'user' | 'provider';
  }>();

  const mapRef = useRef<MapView>(null);
  const lastRouteFetchLocation = useRef<LocationCoords | null>(null);
  const locationBroadcastTimer = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const isRouteRefetchingRef = useRef(false);
  const simulationProgressRef = useRef(0);
  const simulationTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const isSimulatingRef = useRef<boolean>(false);

  const isProvider = role === 'provider';
  const provider = useProviderStore(s => s.provider);
  const didProviderConnectRef = useRef<string | null>(null);
  const initialUserLocation = TEST_CORDS;

  const [userLocation, setUserLocation] =
    useState<LocationCoords>(initialUserLocation);
  const [myLocation, setMyLocation] = useState<LocationCoords | null>(null);
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
    isProvider ? EmergencyStatus.ACCEPTED : EmergencyStatus.PENDING
  );

  const [isCancelling, setIsCancelling] = useState<boolean>(false);
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

  // Fetch nearby providers (only for user when pending)
  const { data: providersData } = useGetNearbyProviders(
    {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      serviceType: emergencyType || 'ambulance',
    },
    !isProvider &&
      !!userLocation.latitude &&
      !!userLocation.longitude &&
      !!emergencyType
  );

  const emergencyRequest = requestData?.data?.data;
  const nearbyProviders = useMemo(
    () => providersData?.data?.providers || [],
    [providersData?.data?.providers]
  );

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
      case 'cancelled' as any:
        return STATUS_MESSAGES.cancelled;
      case 'no_providers_available' as any:
        return STATUS_MESSAGES.no_providers_available;
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
  useEffect(() => {
    const isTestMode = process.env.EXPO_PUBLIC_TEST_MODE === 'true';

    // Only enable in test mode when we have a route and emergency is active
    if (
      !isTestMode ||
      !routeCoordinates.length ||
      currentStatus !== EmergencyStatus.ACCEPTED ||
      !isProvider
    ) {
      return;
    }

    console.log(
      '[SIMULATION] Starting simulated location movement along route'
    );

    isSimulatingRef.current = true;

    // Start simulation
    simulationTimerRef.current = setInterval(() => {
      simulationProgressRef.current += LOCATION_TRACKING.SIMULATION_INCREMENT;

      // Stop when reached destination
      if (simulationProgressRef.current >= 1) {
        simulationProgressRef.current = 1;
        if (simulationTimerRef.current) {
          clearInterval(simulationTimerRef.current);
          isSimulatingRef.current = false;
          simulationTimerRef.current = null;
        }
        console.log('[SIMULATION] Reached destination');
        // Clear remaining route when destination reached
        setRemainingRouteCoordinates([]);
        return;
      }

      // Calculate new location along route
      const newLocation = getPointAtProgress(
        routeCoordinates,
        simulationProgressRef.current
      );

      if (newLocation) {
        console.log(
          `[SIMULATION] Simulated location progress: ${(
            simulationProgressRef.current * 100
          ).toFixed(1)}%`,
          newLocation
        );

        // Update provider's location for real-time display
        setMyLocation(newLocation);
        setProviderLocation(newLocation);

        // Update remaining route (polyline trimming)
        const remaining = getRemainingRouteAfterProgress(
          routeCoordinates,
          simulationProgressRef.current
        );
        console.log('Remaining', remaining);
        setRemainingRouteCoordinates(remaining);
      }
    }, LOCATION_TRACKING.SIMULATION_INTERVAL);

    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        isSimulatingRef.current = false;
        simulationTimerRef.current = null;
      }
    };
  }, [routeCoordinates, currentStatus, isProvider]);

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
    onProviderAccepted: provider => {
      setLocalStatus(EmergencyStatus.ACCEPTED);
      setAssignedProvider(provider);
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

  // Fit map to show all markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const coordinates: LocationCoords[] = [];

    if (userLocation.latitude && userLocation.longitude) {
      coordinates.push(userLocation);
    }

    if (providerLocation) {
      coordinates.push(providerLocation);
    }

    if (coordinates.length > 1) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: MAP_CONFIG.FIT_TO_COORDINATES_PADDING,
        animated: true,
      });
    } else if (coordinates.length === 1) {
      mapRef.current.animateToRegion({
        ...coordinates[0],
        latitudeDelta: MAP_CONFIG.INITIAL_DELTA.latitudeDelta,
        longitudeDelta: MAP_CONFIG.INITIAL_DELTA.longitudeDelta,
      });
    }
  }, [mapReady, userLocation, providerLocation]);

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
              // Get raw socket for emit with callback support
              const socketInstance = socketManager.getSocket();
              if (!socketInstance) {
                Alert.alert(
                  'Error',
                  'Socket connection lost. Please check your connection.'
                );
                return;
              }

              setIsCancelling(true);

              // TODO: Re-enable retry logic after testing
              // For now, single attempt with simple timeout
              await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                  console.log(`CANCEL_REQUEST_SOCKET timeout`);
                  reject(new Error('Timeout'));
                }, LOCATION_TRACKING.SOCKET_TIMEOUT);

                socketInstance.emit(
                  SocketEvents.CANCEL_REQUEST_SOCKET,
                  {
                    requestId,
                    role: role as 'user' | 'provider',
                  },
                  (ack?: any) => {
                    clearTimeout(timeout);
                    if (ack?.error) {
                      reject(new Error(ack.error));
                    } else {
                      resolve();
                    }
                  }
                );
              });

              console.log(`CANCEL_REQUEST_SOCKET succeeded`);
              // If success, the socket listener will handle the redirect
            } catch (error) {
              console.error('Error cancelling request:', error);
              Alert.alert(
                'Error',
                'Failed to cancel request. Please check your connection and try again.'
              );
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleConfirmArrival = () => {
    Alert.alert(
      'Confirm Arrival',
      `${role === 'user' ? 'Has the responder arrived at your location?' : 'Have you arrived to the location ?'}`,
      [
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

            try {
              // Get raw socket for emit with callback support
              const socketInstance = socketManager.getSocket();
              if (!socketInstance) {
                Alert.alert(
                  'Error',
                  'Socket connection lost. Please check your connection.'
                );
                setIsProcessingConfirmation(false);
                return;
              }

              // TODO: Re-enable retry logic after testing
              // For now, single attempt with simple timeout
              await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                  console.log(`CONFIRM_ARRIVAL timeout`);
                  reject(new Error('Timeout'));
                }, LOCATION_TRACKING.SOCKET_TIMEOUT);

                socketInstance.emit(
                  SocketEvents.CONFIRM_ARRIVAL,
                  {
                    requestId,
                    role: role as 'user' | 'provider',
                  },
                  (ack?: any) => {
                    clearTimeout(timeout);
                    if (ack?.error) {
                      reject(new Error(ack.error));
                    } else {
                      resolve();
                    }
                  }
                );
              });

              console.log(`CONFIRM_ARRIVAL succeeded`);
              // If success, the socket listener will handle the redirect
              // and will clear isProcessingConfirmation
            } catch (error) {
              console.error('Error confirming arrival:', error);
              Alert.alert(
                'Error',
                'Failed to confirm arrival. Please check your connection and try again.'
              );
              setIsProcessingConfirmation(false);
            } finally {
              setIsProcessingConfirmation(false);
            }
          },
        },
      ]
    );
  };

  const handleCallProvider = () => {
    if (assignedProvider?.phoneNumber) {
      Linking.openURL(`tel:${assignedProvider.phoneNumber}`);
    }
  };

  const handleRecenterMap = () => {
    if (!mapRef.current) return;

    const coordinates: LocationCoords[] = [];
    if (userLocation.latitude && userLocation.longitude) {
      coordinates.push(userLocation);
    }
    if (providerLocation) {
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.BLACK} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>RESQ</Text>
            <Text style={styles.brandDot}>.</Text>
          </View>
          <View style={styles.headerLine} />
          <Text style={styles.tagline}>EMERGENCY TRACKING</Text>
        </View>
      </View>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          ...userLocation,
          latitudeDelta: MAP_CONFIG.INITIAL_DELTA.latitudeDelta,
          longitudeDelta: MAP_CONFIG.INITIAL_DELTA.longitudeDelta,
        }}
        onMapReady={() => setMapReady(true)}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* User Location Marker */}
        <Marker
          coordinate={userLocation}
          anchor={{ x: 0.5, y: 0.5 }}
          identifier="user"
        >
          <View
            style={[styles.userMarker, { borderColor: emergencyInfo.color }]}
          >
            <MaterialCommunityIcons
              name="account-alert"
              size={20}
              color={emergencyInfo.color}
            />
          </View>
        </Marker>

        {/* Nearby Providers (when searching) */}
        {!isProvider &&
          currentStatus === EmergencyStatus.PENDING &&
          nearbyProviders.map(provider => (
            <Marker
              key={provider.id}
              coordinate={{
                latitude: parseFloat(provider.currentLocation.latitude),
                longitude: parseFloat(provider.currentLocation.longitude),
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.providerMarker}>
                <MaterialCommunityIcons
                  name="car-emergency"
                  size={16}
                  color="#fff"
                />
              </View>
            </Marker>
          ))}

        {/* Assigned Responder / My Location (if provider) Marker */}
        {providerLocation && (
          <Marker
            coordinate={providerLocation}
            anchor={{ x: 0.5, y: 0.5 }}
            identifier="provider"
          >
            <View
              style={[
                styles.assignedProviderMarker,
                { backgroundColor: emergencyInfo.color },
              ]}
            >
              <MaterialCommunityIcons
                name={emergencyInfo.icon as any}
                size={20}
                color="#fff"
              />
            </View>
          </Marker>
        )}

        {/* Route Polyline */}
        {remainingRouteCoordinates.length > 0 && (
          <Polyline
            coordinates={remainingRouteCoordinates}
            strokeColor={emergencyInfo.color}
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}
      </MapView>

      {/* Recenter Button */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenterMap}
      >
        <Ionicons name="locate" size={24} color="#374151" />
      </TouchableOpacity>

      {/* Status Card */}
      <View style={styles.statusCard}>
        {/* Emergency Type Badge */}
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
          {isProvider && (
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Responder</Text>
            </View>
          )}
        </View>

        {/* Status Message */}
        <View style={styles.statusSection}>
          {currentStatus === EmergencyStatus.PENDING && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <ActivityIndicator size="small" color={statusInfo.color} />
            </Animated.View>
          )}
          {currentStatus === EmergencyStatus.ACCEPTED && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={statusInfo.color}
            />
          )}
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.message}
          </Text>
        </View>

        {/* Nearby Providers Count (when searching) */}
        {!isProvider &&
          currentStatus === EmergencyStatus.PENDING &&
          nearbyProviders.length > 0 && (
            <Text style={styles.providersCount}>
              {nearbyProviders.length} provider
              {nearbyProviders.length > 1 ? 's' : ''} nearby
            </Text>
          )}

        {/* Swiss-style Route Info */}
        {routeInfo &&
          (currentStatus === EmergencyStatus.ACCEPTED ||
            currentStatus === EmergencyStatus.IN_PROGRESS) && (
            <View style={styles.routeInfoSwiss}>
              <View style={styles.routeInfoSwissItem}>
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={COLORS.MID_GRAY}
                />
                <Text style={styles.routeInfoSwissText}>
                  {formatDuration(routeInfo.duration)}
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
                  {formatDistance(routeInfo.distance)}
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

        {/* Hairline below route info */}
        {routeInfo &&
          (currentStatus === EmergencyStatus.ACCEPTED ||
            currentStatus === EmergencyStatus.IN_PROGRESS) && (
            <View style={styles.hairline} />
          )}

        {/* Assigned Responder Info (for user) */}
        {!isProvider && assignedProvider && (
          <View style={styles.providerInfo}>
            <View style={styles.providerHeader}>
              <View style={styles.providerAvatar}>
                <MaterialCommunityIcons name="account" size={20} color="#fff" />
              </View>
              <View style={styles.providerDetails}>
                <Text style={styles.providerName}>{assignedProvider.name}</Text>
                {assignedProvider.vehicleNumber && (
                  <Text style={styles.providerVehicle}>
                    {assignedProvider.vehicleNumber}
                  </Text>
                )}
              </View>
            </View>

            {/* Call Button */}
            {assignedProvider.phoneNumber && (
              <TouchableOpacity
                style={styles.callButton}
                onPress={handleCallProvider}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.callButtonText}>Call Responder</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Cancel Button (only for user) */}
        {!isProvider &&
          (currentStatus === EmergencyStatus.PENDING ||
            currentStatus === EmergencyStatus.ACCEPTED) && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelRequest}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color="#EF4444" />
              ) : (
                <>
                  <Ionicons
                    name="close-circle-outline"
                    size={20}
                    color="#EF4444"
                  />
                  <Text style={styles.cancelButtonText}>Cancel Request</Text>
                </>
              )}
            </TouchableOpacity>
          )}

        {/* Confirm Arrival Button (only for user when responder is accepted) */}
        {!isProvider && currentStatus === EmergencyStatus.ACCEPTED && (
          <TouchableOpacity
            style={styles.confirmArrivalButton}
            onPress={handleConfirmArrival}
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
                  Confirm Responder Arrived
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Complete button */}
        {isProvider && currentStatus === EmergencyStatus.ACCEPTED && (
          <TouchableOpacity
            style={styles.confirmArrivalButton}
            onPress={handleConfirmArrival}
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

        {/* Connection Status */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY,
    backgroundColor: COLORS.OFF_WHITE,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  headerContent: {},
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.BLACK,
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.SIGNAL_RED,
    lineHeight: 26,
  },
  headerLine: {
    width: 30,
    height: 2,
    backgroundColor: COLORS.SIGNAL_RED,
    marginTop: 4,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.MID_GRAY,
    letterSpacing: 2,
  },
  map: {
    flex: 1,
  },
  userMarker: {
    ...MARKER_SIZES.USER_MARKER,
    backgroundColor: COLORS.OFF_WHITE,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerMarker: {
    ...MARKER_SIZES.PROVIDER_MARKER,
    backgroundColor: COLORS.MID_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedProviderMarker: {
    ...MARKER_SIZES.ASSIGNED_PROVIDER_MARKER,
    justifyContent: 'center',
    alignItems: 'center',
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
  statusCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.OFF_WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT_GRAY,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    maxHeight: '40%',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.BLACK,
    marginBottom: 10,
  },
  typeBadgeText: {
    color: COLORS.OFF_WHITE,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  roleBadgeText: {
    color: COLORS.OFF_WHITE,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 1,
    color: COLORS.BLACK,
    textTransform: 'uppercase',
  },
  providersCount: {
    fontSize: 11,
    color: COLORS.MID_GRAY,
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  routeInfoSwiss: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 16,
  },
  routeInfoSwissItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoSwissText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginLeft: 4,
    letterSpacing: 1,
  },
  routeInfoSwissDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  hairline: {
    height: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
    marginBottom: 10,
  },
  providerInfo: {
    backgroundColor: COLORS.OFF_WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT_GRAY,
    paddingTop: 8,
    marginBottom: 8,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.BLACK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerDetails: {
    flex: 1,
    marginLeft: 8,
  },
  providerName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.BLACK,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  providerVehicle: {
    fontSize: 10,
    color: COLORS.MID_GRAY,
    letterSpacing: 0.5,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.BLACK,
    marginTop: 12,
  },
  callButtonText: {
    color: COLORS.BLACK,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.SIGNAL_RED,
    marginBottom: 8,
  },
  cancelButtonText: {
    color: COLORS.SIGNAL_RED,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  confirmArrivalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: COLORS.SIGNAL_RED,
    marginBottom: 8,
  },
  confirmArrivalButtonText: {
    color: COLORS.OFF_WHITE,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 10,
    color: COLORS.MID_GRAY,
    letterSpacing: 1,
  },
});
