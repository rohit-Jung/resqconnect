import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import OfflineFallbackModal from '@/components/OfflineFallbackModal';
import OfflineIndicator from '@/components/OfflineIndicator';
import { useEmergencyRoom } from '@/hooks/useEmergencyRoom';
import { useEmergencyNetworkStatus } from '@/hooks/useNetworkStatus';
import { useCreateEmergencyRequest } from '@/services/emergency/emergency.api';
import { SyncSummary } from '@/services/syncService';
import { TEmergencyType } from '@/validations/emergency.schema';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const EMERGENCY_TYPES: {
  type: TEmergencyType;
  label: string;
  icon: string;
  color: string;
}[] = [
  { type: 'ambulance', label: 'Medical', icon: 'ambulance', color: SIGNAL_RED },
  { type: 'police', label: 'Police', icon: 'shield-account', color: '#3B82F6' },
  { type: 'fire_truck', label: 'Fire', icon: 'fire-truck', color: '#F97316' },
  { type: 'rescue_team', label: 'Rescue', icon: 'lifebuoy', color: '#10B981' },
];

export default function EmergencyRequestScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  // Initialize emergency room socket listeners (user role)
  useEmergencyRoom('user');

  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineModalLocation, setOfflineModalLocation] =
    useState<Location.LocationObject | null>(null);

  const handleOfflineDetected = useCallback(() => {
    console.log('[EmergencyRequest] Offline detected');
  }, []);

  const handleBackOnline = useCallback((summary: SyncSummary) => {
    if (summary.synced > 0) {
      Alert.alert(
        'Requests Synced',
        `${summary.synced} emergency request(s) have been synced successfully.`,
        [{ text: 'OK' }]
      );
    }
  }, []);

  const { isConnected, isInternetReachable, isOffline, refresh, triggerSync } =
    useEmergencyNetworkStatus(handleOfflineDetected, handleBackOnline);

  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [fullLocationObject, setFullLocationObject] =
    useState<Location.LocationObject | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [selectedType, setSelectedType] = useState<TEmergencyType | null>(null);
  const [description, setDescription] = useState('');
  const [markerLocation, setMarkerLocation] = useState<LocationCoords | null>(
    null
  );

  const { mutate: createEmergency, isPending } = useCreateEmergencyRequest();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to create emergency requests.'
        );
        setIsLoadingLocation(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setLocation(coords);
      setMarkerLocation(coords);
      setFullLocationObject(currentLocation);
      setIsLoadingLocation(false);
    })();
  }, []);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMarkerLocation({ latitude, longitude });
  };

  const centerOnCurrentLocation = async () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        ...location,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setMarkerLocation(location);
    }
  };

  const handleRetryOnline = useCallback(async (): Promise<boolean> => {
    await refresh();

    if (isConnected && isInternetReachable) {
      return new Promise(resolve => {
        if (!selectedType || !markerLocation) {
          resolve(false);
          return;
        }

        createEmergency(
          {
            emergencyType: selectedType,
            emergencyDescription: description || selectedType,
            userLocation: markerLocation,
          },
          {
            onSuccess: response => {
              setShowOfflineModal(false);
              const requestId = response.data?.data?.emergencyRequest?.id;
              router.replace({
                pathname: '/emergency-tracking',
                params: {
                  requestId,
                  emergencyType: selectedType,
                  latitude: markerLocation.latitude.toString(),
                  longitude: markerLocation.longitude.toString(),
                  role: 'user',
                },
              });
              resolve(true);
            },
            onError: () => {
              resolve(false);
            },
          }
        );
      });
    }

    return false;
  }, [
    refresh,
    isConnected,
    isInternetReachable,
    selectedType,
    markerLocation,
    description,
    createEmergency,
    router,
  ]);

  const handleSubmit = () => {
    if (!selectedType) {
      Alert.alert('Error', 'Please select an emergency type.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please describe your emergency.');
      return;
    }

    if (!markerLocation) {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
      return;
    }

    if (isOffline) {
      if (fullLocationObject) {
        setOfflineModalLocation(fullLocationObject);
      } else {
        setOfflineModalLocation({
          coords: {
            latitude: markerLocation.latitude,
            longitude: markerLocation.longitude,
            altitude: null,
            accuracy: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }
      setShowOfflineModal(true);
      return;
    }

    createEmergency(
      {
        emergencyType: selectedType,
        emergencyDescription: description,
        userLocation: markerLocation,
      },
      {
        onSuccess: response => {
          const requestId = response.data?.data?.emergencyRequest?.id;
          router.replace({
            pathname: '/emergency-tracking',
            params: {
              requestId,
              emergencyType: selectedType,
              latitude: markerLocation.latitude.toString(),
              longitude: markerLocation.longitude.toString(),
              role: 'user',
            },
          });
        },
        onError: (error: any) => {
          if (!error.response) {
            if (fullLocationObject) {
              setOfflineModalLocation(fullLocationObject);
            } else {
              setOfflineModalLocation({
                coords: {
                  latitude: markerLocation.latitude,
                  longitude: markerLocation.longitude,
                  altitude: null,
                  accuracy: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null,
                },
                timestamp: Date.now(),
              });
            }
            setShowOfflineModal(true);
          } else {
            Alert.alert(
              'Error',
              error.response?.data?.message ||
                'Failed to create emergency request. Please try again.'
            );
          }
        },
      }
    );
  };

  if (isLoadingLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>GETTING YOUR LOCATION...</Text>
      </View>
    );
  }

  return (
    <Pressable style={styles.container} onPress={Keyboard.dismiss}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={PRIMARY} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>RESQ</Text>
            <Text style={styles.brandDot}>.</Text>
          </View>
          <View style={styles.headerLine} />
          <Text style={styles.tagline}>EMERGENCY REQUEST</Text>
        </View>
      </View>

      {/* Offline Indicator */}
      <OfflineIndicator
        isOffline={isOffline}
        onSMSFallback={() =>
          router.push({
            pathname: '/sms-emergency',
            params: selectedType ? { emergencyType: selectedType } : {},
          })
        }
      />

      {/* Offline Fallback Modal */}
      <OfflineFallbackModal
        visible={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        emergencyType={selectedType || 'ambulance'}
        location={offlineModalLocation}
        description={description}
        onRetryOnline={handleRetryOnline}
        autoSMSAfterTimeout={15}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Map */}
          <View style={styles.mapContainer}>
            {location ? (
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton={false}
              >
                {markerLocation && (
                  <Marker
                    coordinate={markerLocation}
                    draggable
                    onDragEnd={e => setMarkerLocation(e.nativeEvent.coordinate)}
                  >
                    <View style={styles.markerContainer}>
                      <View style={styles.markerInner}>
                        <Ionicons name="location" size={24} color={OFF_WHITE} />
                      </View>
                      <View style={styles.markerArrow} />
                    </View>
                  </Marker>
                )}
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                <Ionicons name="location-outline" size={48} color={MID_GRAY} />
                <Text style={styles.mapPlaceholderText}>
                  LOCATION UNAVAILABLE
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.locateButton}
              onPress={centerOnCurrentLocation}
              activeOpacity={0.7}
            >
              <Ionicons name="locate" size={24} color={SIGNAL_RED} />
            </TouchableOpacity>
          </View>

          {/* Location Info */}
          <View style={styles.locationInfo}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={18} color={SIGNAL_RED} />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationLabel}>EMERGENCY LOCATION</Text>
              <Text style={styles.locationCoords}>
                {markerLocation
                  ? `${markerLocation.latitude.toFixed(6)}, ${markerLocation.longitude.toFixed(6)}`
                  : 'Tap on map to set location'}
              </Text>
            </View>
          </View>

          {/* Emergency Type Selection */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TYPE OF EMERGENCY</Text>
              <View style={styles.sectionLine} />
            </View>

            <View style={styles.typeGrid}>
              {EMERGENCY_TYPES.map(item => (
                <TouchableOpacity
                  key={item.type}
                  style={[
                    styles.typeCard,
                    selectedType === item.type && styles.typeCardActive,
                    {
                      borderColor:
                        selectedType === item.type ? item.color : LIGHT_GRAY,
                    },
                  ]}
                  onPress={() => {
                    setSelectedType(item.type);
                    setDescription(item.type);
                  }}
                  disabled={isPending}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.typeIcon,
                      { backgroundColor: `${item.color}20` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={item.icon as any}
                      size={24}
                      color={item.color}
                    />
                  </View>
                  <Text
                    style={[
                      styles.typeLabel,
                      selectedType === item.type && { color: item.color },
                    ]}
                  >
                    {item.label.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>DESCRIBE EMERGENCY</Text>
              <View style={styles.sectionLine} />
            </View>

            <TextInput
              style={styles.descriptionInput}
              placeholder="Please provide details about your emergency..."
              placeholderTextColor={MID_GRAY}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              editable={!isPending}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedType || !description.trim() || isPending) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedType || !description.trim() || isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator color={OFF_WHITE} />
            ) : (
              <>
                <Ionicons name="alert-circle" size={20} color={OFF_WHITE} />
                <Text style={styles.submitButtonText}>
                  SEND EMERGENCY REQUEST
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Your location will be shared with emergency responders
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    backgroundColor: LIGHT_GRAY,
  },
  headerContent: {},
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 22,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 26,
  },
  headerLine: {
    width: 30,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 4,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: OFF_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 2,
    marginTop: 16,
  },
  mapContainer: {
    height: 240,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 2,
    marginTop: 8,
  },
  locateButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: OFF_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerArrow: {
    width: 12,
    height: 12,
    backgroundColor: PRIMARY,
    transform: [{ rotate: '45deg' }],
    marginTop: -6,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: LIGHT_GRAY,
    marginHorizontal: 24,
    marginTop: 16,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
    marginBottom: 2,
  },
  locationCoords: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  typeCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: '1%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  typeCardActive: {
    backgroundColor: LIGHT_GRAY,
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
  },
  descriptionInput: {
    backgroundColor: LIGHT_GRAY,
    padding: 16,
    fontSize: 14,
    color: PRIMARY,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SIGNAL_RED,
    marginHorizontal: 24,
    marginTop: 24,
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    backgroundColor: MID_GRAY,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 2,
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 10,
    color: MID_GRAY,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 24,
    letterSpacing: 1,
  },
});
