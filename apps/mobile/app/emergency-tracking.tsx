import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
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

import { SocketEvents } from '@/constants/socket.constants';
import { TEST_CORDS } from '@/constants/test.constants';
import {
  useCancelEmergencyRequest,
  useConfirmProviderArrival,
  useGetEmergencyRequest,
  useGetNearbyProviders,
} from '@/services/emergency/emergency.api';
import { fetchRoute } from '@/services/maps/maps.api';
import { socketManager } from '@/socket/socket-manager';
import { useSocketStore } from '@/store/socketStore';
import { EmergencyStatus, IAssignedProvider } from '@/types/emergency.types';
import {
  formatDistance,
  formatDuration,
  haversineDistance,
  mapboxToLatLng,
} from '@/utils/location.utils';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const EMERGENCY_ICONS: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  ambulance: { icon: 'ambulance', color: '#EF4444', label: 'Medical' },
  police: { icon: 'shield-account', color: '#3B82F6', label: 'Police' },
  fire_truck: { icon: 'fire-truck', color: '#F97316', label: 'Fire' },
  rescue_team: { icon: 'lifebuoy', color: '#10B981', label: 'Rescue' },
};

const STATUS_MESSAGES: Record<string, { message: string; color: string }> = {
  pending: { message: 'Finding nearby providers...', color: '#F59E0B' },
  accepted: { message: 'Provider is on the way!', color: '#10B981' },
  in_progress: { message: 'Help is arriving', color: '#3B82F6' },
  completed: { message: 'Emergency resolved', color: '#10B981' },
  cancelled: { message: 'Request cancelled', color: '#6B7280' },
  no_providers_available: {
    message: 'No providers available nearby',
    color: '#EF4444',
  },
};

// Route refetch threshold (meters)
const ROUTE_REFETCH_THRESHOLD = 50;
// Location update broadcast interval (ms)
const LOCATION_BROADCAST_INTERVAL = 3000;

export default function EmergencyTrackingScreen() {
  const router = useRouter();
  const { requestId, emergencyType, role } = useLocalSearchParams<{
    requestId: string;
    emergencyType: string;
    role?: 'user' | 'provider';
  }>();

  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const lastRouteFetchLocation = useRef<LocationCoords | null>(null);
  const locationBroadcastTimer = useRef<NodeJS.Timeout | null>(null);
  const isRouteRefetchingRef = useRef(false);

  // Determine if current user is provider or user
  const isProvider = role === 'provider';

  // For testing: Both user and provider see user at TEST_CORDS location
  // In production, this would come from the emergency request data
  const initialUserLocation = TEST_CORDS;

  const [userLocation, setUserLocation] =
    useState<LocationCoords>(initialUserLocation);
  const [myLocation, setMyLocation] = useState<LocationCoords | null>(null);
  const [assignedProvider, setAssignedProvider] =
    useState<IAssignedProvider | null>(null);
  const [providerLocation, setProviderLocation] =
    useState<LocationCoords | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<LatLng[]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  // Provider starts with ACCEPTED status since they've already accepted
  // User starts with PENDING and waits for socket update
  const [localStatus, setLocalStatus] = useState<EmergencyStatus>(
    isProvider ? EmergencyStatus.ACCEPTED : EmergencyStatus.PENDING
  );

  const { socket, isConnected } = useSocketStore();

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

  const { mutate: cancelRequest, isPending: isCancelling } =
    useCancelEmergencyRequest();
  const { mutate: confirmArrival, isPending: isConfirmingArrival } =
    useConfirmProviderArrival();

  const emergencyRequest = requestData?.data?.data;
  const nearbyProviders = useMemo(
    () => providersData?.data?.providers || [],
    [providersData?.data?.providers]
  );

  // Use local status that can be updated from socket events
  const currentStatus = localStatus;

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

    // Check if we need to refetch (significant movement)
    if (lastRouteFetchLocation.current) {
      const moved = haversineDistance(
        lastRouteFetchLocation.current.latitude,
        lastRouteFetchLocation.current.longitude,
        routeOrigin.lat,
        routeOrigin.lng
      );
      if (moved < ROUTE_REFETCH_THRESHOLD) {
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

  // Pulse animation for searching state
  useEffect(() => {
    if (currentStatus === EmergencyStatus.PENDING) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [currentStatus, pulseAnim]);

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
            timeInterval: 3000, // Update every 3 seconds
            distanceInterval: 5, // Or when moved 5 meters
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
      LOCATION_BROADCAST_INTERVAL
    );

    return () => {
      if (locationBroadcastTimer.current) {
        clearInterval(locationBroadcastTimer.current);
      }
    };
  }, [requestId, myLocation, socket, isConnected, isProvider]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!requestId) return;

    // Join the emergency room
    socketManager.emit(SocketEvents.USER_JOIN_ROOM, {
      requestId,
      userId: socket?.id,
    });

    // Listen for provider location updates
    const handleProviderLocation = (data: any) => {
      console.log('Provider location update:', data);
      if (data.location && !isProvider) {
        const lat =
          typeof data.location.latitude === 'string'
            ? parseFloat(data.location.latitude)
            : data.location.latitude;
        const lng =
          typeof data.location.longitude === 'string'
            ? parseFloat(data.location.longitude)
            : data.location.longitude;

        if (!isNaN(lat) && !isNaN(lng)) {
          setProviderLocation({
            latitude: lat,
            longitude: lng,
          });
        }
      }
    };

    // Listen for user location updates (for provider)
    const handleUserLocation = (data: any) => {
      console.log('User location update:', data);
      if (data.location && isProvider) {
        setUserLocation({
          latitude: parseFloat(data.location.latitude),
          longitude: parseFloat(data.location.longitude),
        });
      }
    };

    // Listen for provider acceptance
    const handleProviderAccepted = (data: any) => {
      console.log(
        'Provider accepted - full data:',
        JSON.stringify(data, null, 2)
      );

      // Update local status immediately
      setLocalStatus(EmergencyStatus.ACCEPTED);

      if (data.provider) {
        setAssignedProvider({
          id: data.provider.id,
          name: data.provider.name,
          serviceType: data.provider.serviceType,
          currentLocation: data.provider.location,
          distance: 0,
          phoneNumber: data.provider.phone,
          vehicleNumber: data.provider.vehicleNumber,
          estimatedArrival: data.route?.duration,
        });

        // Set provider location if available
        if (
          data.provider.location?.latitude &&
          data.provider.location?.longitude
        ) {
          const lat =
            typeof data.provider.location.latitude === 'string'
              ? parseFloat(data.provider.location.latitude)
              : data.provider.location.latitude;
          const lng =
            typeof data.provider.location.longitude === 'string'
              ? parseFloat(data.provider.location.longitude)
              : data.provider.location.longitude;

          if (!isNaN(lat) && !isNaN(lng)) {
            console.log('Setting provider location:', { lat, lng });
            setProviderLocation({ latitude: lat, longitude: lng });
          } else {
            console.warn(
              'Invalid provider location coordinates:',
              data.provider.location
            );
          }
        } else {
          console.warn('Provider location not available in acceptance data');
        }

        // Set initial route from acceptance response
        if (
          data.route?.coordinates &&
          Array.isArray(data.route.coordinates) &&
          data.route.coordinates.length > 0
        ) {
          console.log(
            'Setting route from acceptance - coordinates count:',
            data.route.coordinates.length
          );
          const coords = mapboxToLatLng(data.route.coordinates);
          setRouteCoordinates(coords);
          setRouteInfo({
            distance: data.route.distance,
            duration: data.route.duration,
          });
        } else {
          console.warn(
            'Route coordinates not available in acceptance data - will fetch when provider location updates'
          );
        }
      }
    };

    // Listen for emergency completion
    const handleEmergencyCompleted = () => {
      Alert.alert(
        'Emergency Resolved',
        'The emergency has been marked as completed.',
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace(isProvider ? '/(provider)/dashboard' : '/(tabs)'),
          },
        ]
      );
    };

    // Listen for request cancellation (for provider when user cancels)
    const handleRequestCancelled = (data: any) => {
      console.log('Request cancelled:', data);
      if (data.requestId === requestId) {
        Alert.alert(
          'Request Cancelled',
          data.message || 'The user has cancelled this emergency request.',
          [
            {
              text: 'OK',
              onPress: () =>
                router.replace(
                  isProvider ? '/(provider)/dashboard' : '/(tabs)'
                ),
            },
          ]
        );
      }
    };

    socketManager.on(
      SocketEvents.PROVIDER_LOCATION_UPDATED,
      handleProviderLocation
    );
    socketManager.on(SocketEvents.USER_LOCATION_UPDATED, handleUserLocation);
    socketManager.on(SocketEvents.REQUEST_ACCEPTED, handleProviderAccepted);
    socketManager.on(SocketEvents.REQUEST_COMPLETED, handleEmergencyCompleted);
    socketManager.on(SocketEvents.REQUEST_CANCELLED, handleRequestCancelled);

    return () => {
      socketManager.off(
        SocketEvents.PROVIDER_LOCATION_UPDATED,
        handleProviderLocation
      );
      socketManager.off(SocketEvents.USER_LOCATION_UPDATED, handleUserLocation);
      socketManager.off(SocketEvents.REQUEST_ACCEPTED, handleProviderAccepted);
      socketManager.off(
        SocketEvents.REQUEST_COMPLETED,
        handleEmergencyCompleted
      );
      socketManager.off(SocketEvents.REQUEST_CANCELLED, handleRequestCancelled);
    };
  }, [requestId, socket?.id, isProvider, router]);

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
        edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
        animated: true,
      });
    } else if (coordinates.length === 1) {
      mapRef.current.animateToRegion({
        ...coordinates[0],
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
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
          onPress: () => {
            cancelRequest(requestId!, {
              onSuccess: () => {
                Alert.alert(
                  'Cancelled',
                  'Your emergency request has been cancelled.',
                  [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
                );
              },
              onError: (error: any) => {
                Alert.alert(
                  'Error',
                  error.response?.data?.message || 'Failed to cancel request.'
                );
              },
            });
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
          onPress: () => {
            confirmArrival(requestId!, {
              onSuccess: () => {
                Alert.alert(
                  'Arrival Confirmed',
                  'Thank you for confirming. The service provider has arrived.',
                  [{ text: 'OK' }]
                );
              },
              onError: (error: any) => {
                Alert.alert(
                  'Error',
                  error.response?.data?.message || 'Failed to confirm arrival.'
                );
              },
            });
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
        edgePadding: { top: 100, right: 50, bottom: 250, left: 50 },
        animated: true,
      });
    } else if (myLocation) {
      mapRef.current.animateToRegion({
        ...myLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const emergencyInfo = EMERGENCY_ICONS[emergencyType || 'ambulance'];
  const statusInfo = STATUS_MESSAGES[currentStatus] || STATUS_MESSAGES.pending;

  if (isLoadingRequest) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E13333" />
        <Text style={styles.loadingText}>Loading emergency details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          ...userLocation,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
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

        {/* Assigned Provider / My Location (if provider) Marker */}
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
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
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

      {/* Route Info Badge */}
      {routeInfo && (
        <View style={styles.routeInfoBadge}>
          <View style={styles.routeInfoItem}>
            <Ionicons name="time-outline" size={16} color="#10B981" />
            <Text style={styles.routeInfoText}>
              {formatDuration(routeInfo.duration)}
            </Text>
          </View>
          <View style={styles.routeInfoDivider} />
          <View style={styles.routeInfoItem}>
            <Ionicons name="navigate-outline" size={16} color="#3B82F6" />
            <Text style={styles.routeInfoText}>
              {formatDistance(routeInfo.distance)}
            </Text>
          </View>
          {isLoadingRoute && (
            <ActivityIndicator
              size="small"
              color="#6B7280"
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      )}

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
              <Text style={styles.roleBadgeText}>Provider</Text>
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

        {/* Route ETA and Distance */}
        {routeInfo &&
          (currentStatus === EmergencyStatus.ACCEPTED ||
            currentStatus === EmergencyStatus.IN_PROGRESS) && (
            <View style={styles.etaSection}>
              <View style={styles.etaBox}>
                <Text style={styles.etaValue}>
                  {Math.round(routeInfo.duration)}
                </Text>
                <Text style={styles.etaLabel}>min away</Text>
              </View>
              <View style={styles.distanceBox}>
                <Text style={styles.distanceValue}>
                  {routeInfo.distance.toFixed(1)}
                </Text>
                <Text style={styles.distanceLabel}>km</Text>
              </View>
            </View>
          )}

        {/* Assigned Provider Info (for user) */}
        {!isProvider && assignedProvider && (
          <View style={styles.providerInfo}>
            <View style={styles.providerHeader}>
              <View style={styles.providerAvatar}>
                <MaterialCommunityIcons name="account" size={24} color="#fff" />
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
                <Text style={styles.callButtonText}>Call Provider</Text>
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

        {/* Confirm Arrival Button (only for user when provider is accepted) */}
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
                  Confirm Provider Arrived
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  providerMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedProviderMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  recenterButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeInfoBadge: {
    position: 'absolute',
    top: 60,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 4,
    fontFamily: 'Inter',
  },
  routeInfoDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 10,
  },
  statusCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: '50%',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  roleBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    fontFamily: 'Inter',
  },
  providersCount: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  etaSection: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  etaBox: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: 12,
  },
  etaValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  etaLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  distanceBox: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  distanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  distanceLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  providerInfo: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'Inter',
  },
  providerVehicle: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    marginBottom: 12,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    fontFamily: 'Inter',
  },
  confirmArrivalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#10B981',
    borderRadius: 12,
    marginBottom: 12,
  },
  confirmArrivalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    fontFamily: 'Inter',
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
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
});
