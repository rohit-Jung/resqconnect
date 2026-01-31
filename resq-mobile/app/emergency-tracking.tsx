import { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Linking,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  useGetEmergencyRequest,
  useGetNearbyProviders,
  useCancelEmergencyRequest,
} from '@/services/emergency/emergency.api';
import { useSocketStore } from '@/store/socketStore';
import { EmergencyStatus, IAssignedProvider } from '@/types/emergency.types';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const EMERGENCY_ICONS: Record<string, { icon: string; color: string; label: string }> = {
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
  no_providers_available: { message: 'No providers available nearby', color: '#EF4444' },
};

export default function EmergencyTrackingScreen() {
  const router = useRouter();
  const { requestId, emergencyType, latitude, longitude } = useLocalSearchParams<{
    requestId: string;
    emergencyType: string;
    latitude: string;
    longitude: string;
  }>();

  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [userLocation] = useState<LocationCoords>({
    latitude: parseFloat(latitude || '0'),
    longitude: parseFloat(longitude || '0'),
  });
  const [assignedProvider, setAssignedProvider] = useState<IAssignedProvider | null>(null);
  const [providerLocation, setProviderLocation] = useState<LocationCoords | null>(null);

  const { socket, isConnected } = useSocketStore();

  // Fetch emergency request status
  const { data: requestData, isLoading: isLoadingRequest } = useGetEmergencyRequest(
    requestId || '',
    !!requestId
  );

  // Fetch nearby providers
  const { data: providersData } = useGetNearbyProviders(
    {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      serviceType: emergencyType || 'ambulance',
    },
    !!userLocation.latitude && !!userLocation.longitude && !!emergencyType
  );

  const { mutate: cancelRequest, isPending: isCancelling } = useCancelEmergencyRequest();

  const emergencyRequest = requestData?.data?.data;
  const nearbyProviders = useMemo(
    () => providersData?.data?.providers || [],
    [providersData?.data?.providers]
  );
  const currentStatus = emergencyRequest?.status || EmergencyStatus.PENDING;

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

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !requestId) return;

    // Join the emergency room
    socket.emit('join-emergency-room', { requestId });

    // Listen for provider acceptance
    socket.on('provider-accepted', (data: any) => {
      console.log('Provider accepted:', data);
      setAssignedProvider({
        id: data.providerId,
        name: data.providerName,
        serviceType: data.serviceType,
        currentLocation: data.providerLocation,
        distance: data.distance,
        phoneNumber: data.phoneNumber,
        vehicleNumber: data.vehicleNumber,
        estimatedArrival: data.eta,
      });
      if (data.providerLocation) {
        setProviderLocation({
          latitude: parseFloat(data.providerLocation.latitude),
          longitude: parseFloat(data.providerLocation.longitude),
        });
      }
    });

    // Listen for provider location updates
    socket.on('provider-location-update', (data: any) => {
      console.log('Provider location update:', data);
      if (data.location) {
        setProviderLocation({
          latitude: parseFloat(data.location.latitude),
          longitude: parseFloat(data.location.longitude),
        });
      }
    });

    // Listen for status updates
    socket.on('emergency-status-update', (data: any) => {
      console.log('Status update:', data);
      // The query will refetch and update automatically
    });

    // Listen for emergency completion
    socket.on('emergency-completed', () => {
      Alert.alert('Emergency Resolved', 'Your emergency has been marked as completed.', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    });

    return () => {
      socket.off('provider-accepted');
      socket.off('provider-location-update');
      socket.off('emergency-status-update');
      socket.off('emergency-completed');
      socket.emit('leave-emergency-room', { requestId });
    };
  }, [socket, requestId, router]);

  // Fit map to show all markers
  useEffect(() => {
    if (mapRef.current && userLocation) {
      const coordinates = [userLocation];
      if (providerLocation) {
        coordinates.push(providerLocation);
      }
      nearbyProviders.forEach((p) => {
        if (p.currentLocation) {
          coordinates.push({
            latitude: parseFloat(p.currentLocation.latitude),
            longitude: parseFloat(p.currentLocation.longitude),
          });
        }
      });

      if (coordinates.length > 1) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
      }
    }
  }, [userLocation, providerLocation, nearbyProviders]);

  const handleCancelRequest = () => {
    Alert.alert('Cancel Emergency', 'Are you sure you want to cancel this emergency request?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => {
          cancelRequest(requestId!, {
            onSuccess: () => {
              Alert.alert('Cancelled', 'Your emergency request has been cancelled.', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') },
              ]);
            },
            onError: (error: any) => {
              Alert.alert('Error', error.response?.data?.message || 'Failed to cancel request.');
            },
          });
        },
      },
    ]);
  };

  const handleCallProvider = () => {
    if (assignedProvider?.phoneNumber) {
      Linking.openURL(`tel:${assignedProvider.phoneNumber}`);
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
        showsUserLocation={false}>
        {/* User Location Marker */}
        <Marker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.userMarker, { borderColor: emergencyInfo.color }]}>
            <MaterialCommunityIcons
              name={emergencyInfo.icon as any}
              size={20}
              color={emergencyInfo.color}
            />
          </View>
        </Marker>

        {/* Nearby Providers (when searching) */}
        {currentStatus === EmergencyStatus.PENDING &&
          nearbyProviders.map((provider) => (
            <Marker
              key={provider.id}
              coordinate={{
                latitude: parseFloat(provider.currentLocation.latitude),
                longitude: parseFloat(provider.currentLocation.longitude),
              }}
              anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.providerMarker}>
                <MaterialCommunityIcons name="car-emergency" size={16} color="#fff" />
              </View>
            </Marker>
          ))}

        {/* Assigned Provider Marker */}
        {providerLocation && (
          <Marker coordinate={providerLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[styles.assignedProviderMarker, { backgroundColor: emergencyInfo.color }]}>
              <MaterialCommunityIcons name={emergencyInfo.icon as any} size={20} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Route line between provider and user */}
        {providerLocation && (
          <Polyline
            coordinates={[providerLocation, userLocation]}
            strokeColor={emergencyInfo.color}
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}
      </MapView>

      {/* Status Card */}
      <View style={styles.statusCard}>
        {/* Emergency Type Badge */}
        <View style={[styles.typeBadge, { backgroundColor: emergencyInfo.color }]}>
          <MaterialCommunityIcons name={emergencyInfo.icon as any} size={24} color="#fff" />
          <Text style={styles.typeBadgeText}>{emergencyInfo.label} Emergency</Text>
        </View>

        {/* Status Message */}
        <View style={styles.statusSection}>
          {currentStatus === EmergencyStatus.PENDING && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <ActivityIndicator size="small" color={statusInfo.color} />
            </Animated.View>
          )}
          {currentStatus === EmergencyStatus.ACCEPTED && (
            <Ionicons name="checkmark-circle" size={24} color={statusInfo.color} />
          )}
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.message}</Text>
        </View>

        {/* Nearby Providers Count (when searching) */}
        {currentStatus === EmergencyStatus.PENDING && nearbyProviders.length > 0 && (
          <Text style={styles.providersCount}>
            {nearbyProviders.length} provider{nearbyProviders.length > 1 ? 's' : ''} nearby
          </Text>
        )}

        {/* Assigned Provider Info */}
        {assignedProvider && (
          <View style={styles.providerInfo}>
            <View style={styles.providerHeader}>
              <View style={styles.providerAvatar}>
                <MaterialCommunityIcons name="account" size={24} color="#fff" />
              </View>
              <View style={styles.providerDetails}>
                <Text style={styles.providerName}>{assignedProvider.name}</Text>
                {assignedProvider.vehicleNumber && (
                  <Text style={styles.providerVehicle}>{assignedProvider.vehicleNumber}</Text>
                )}
              </View>
              {assignedProvider.estimatedArrival && (
                <View style={styles.etaContainer}>
                  <Text style={styles.etaValue}>{assignedProvider.estimatedArrival}</Text>
                  <Text style={styles.etaLabel}>min</Text>
                </View>
              )}
            </View>

            {/* Call Button */}
            {assignedProvider.phoneNumber && (
              <TouchableOpacity style={styles.callButton} onPress={handleCallProvider}>
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.callButtonText}>Call Provider</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Cancel Button */}
        {(currentStatus === EmergencyStatus.PENDING ||
          currentStatus === EmergencyStatus.ACCEPTED) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancelRequest}
            disabled={isCancelling}>
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

        {/* Connection Status */}
        <View style={styles.connectionStatus}>
          <View
            style={[styles.connectionDot, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]}
          />
          <Text style={styles.connectionText}>{isConnected ? 'Connected' : 'Reconnecting...'}</Text>
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
  etaContainer: {
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  etaValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  etaLabel: {
    fontSize: 12,
    color: '#fff',
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
