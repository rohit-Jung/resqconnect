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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import OfflineFallbackModal from '@/components/OfflineFallbackModal';
import OfflineIndicator from '@/components/OfflineIndicator';
import { useEmergencyRoom } from '@/hooks/useEmergencyRoom';
import { useEmergencyNetworkStatus } from '@/hooks/useNetworkStatus';
import { useCreateEmergencyRequest } from '@/services/emergency/emergency.api';
import {
  extractResultCoords,
  useAutocomplete,
  useReverseGeocode,
} from '@/services/maps/maps.api';
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  useEmergencyRoom('user');

  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineModalLocation, setOfflineModalLocation] =
    useState<Location.LocationObject | null>(null);

  const handleOfflineDetected = useCallback(() => {}, []);

  const handleBackOnline = useCallback((summary: SyncSummary) => {
    if (summary.synced > 0) {
      Alert.alert(
        'Requests Synced',
        `${summary.synced} emergency request(s) have been synced successfully.`,
        [{ text: 'OK' }]
      );
    }
  }, []);

  const { isConnected, isInternetReachable, isOffline, refresh } =
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

  // Debounced marker for reverse geocoding
  const [debouncedMarker, setDebouncedMarker] = useState<LocationCoords | null>(
    null
  );
  useEffect(() => {
    const t = setTimeout(() => setDebouncedMarker(markerLocation), 800);
    return () => clearTimeout(t);
  }, [markerLocation]);

  const { data: resolvedAddress, isFetching: isResolvingAddress } =
    useReverseGeocode(
      debouncedMarker?.latitude ?? null,
      debouncedMarker?.longitude ?? null
    );

  // Location search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 600);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: searchResults = [], isFetching: isSearching } = useAutocomplete(
    debouncedSearch,
    location?.latitude ?? null,
    location?.longitude ?? null
  );

  const showDropdown = debouncedSearch.length >= 3 && searchResults.length > 0;

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

  const handleSelectSearchResult = (result: any) => {
    const coords = extractResultCoords(result);
    if (!coords) return;
    setMarkerLocation(coords);
    setSearchQuery('');
    setDebouncedSearch('');
    Keyboard.dismiss();
    mapRef.current?.animateToRegion({
      ...coords,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

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
            onError: () => resolve(false),
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
      setOfflineModalLocation(
        fullLocationObject ?? {
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
        }
      );
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
            setOfflineModalLocation(
              fullLocationObject ?? {
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
              }
            );
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
    <Pressable
      style={styles.container}
      onPress={() => {
        Keyboard.dismiss();
        setDebouncedSearch('');
        setSearchQuery('');
      }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
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

      <OfflineIndicator
        isOffline={isOffline}
        onSMSFallback={() =>
          router.push({
            pathname: '/sms-emergency',
            params: selectedType ? { emergencyType: selectedType } : {},
          })
        }
      />

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
          keyboardShouldPersistTaps="handled"
        >
          {/* Location Search */}
          <View style={styles.searchSection}>
            <View style={styles.searchBar}>
              <Ionicons
                name="search"
                size={18}
                color={MID_GRAY}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search location..."
                placeholderTextColor={MID_GRAY}
                value={searchQuery}
                onChangeText={text => {
                  setSearchQuery(text);
                  if (text.length < 3) setDebouncedSearch('');
                }}
                returnKeyType="search"
                autoCorrect={false}
              />
              {isSearching && searchQuery.length >= 3 && (
                <ActivityIndicator
                  size="small"
                  color={SIGNAL_RED}
                  style={{ marginRight: 8 }}
                />
              )}
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setDebouncedSearch('');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color={MID_GRAY} />
                </TouchableOpacity>
              )}
            </View>

            {showDropdown && (
              <View style={styles.dropdown}>
                {searchResults.slice(0, 5).map((result, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.dropdownItem,
                      idx < Math.min(searchResults.length, 5) - 1 &&
                        styles.dropdownItemBorder,
                    ]}
                    onPress={() => handleSelectSearchResult(result)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="location-outline"
                      size={16}
                      color={SIGNAL_RED}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.dropdownItemText} numberOfLines={2}>
                      {result.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

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
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>EMERGENCY LOCATION</Text>
              {!markerLocation ? (
                <Text style={styles.locationCoords}>
                  Tap on map to set location
                </Text>
              ) : isResolvingAddress ? (
                <View style={styles.locationResolvingRow}>
                  <ActivityIndicator
                    size="small"
                    color={SIGNAL_RED}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.locationResolving}>LOCATING...</Text>
                </View>
              ) : (
                <>
                  {resolvedAddress ? (
                    <Text style={styles.locationCoords} numberOfLines={2}>
                      {resolvedAddress}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.locationCoordsSmall,
                      resolvedAddress ? { marginTop: 2 } : {},
                    ]}
                  >
                    {markerLocation.latitude.toFixed(5)},{' '}
                    {markerLocation.longitude.toFixed(5)}
                  </Text>
                </>
              )}
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
                    if (selectedType === item.type) {
                      Alert.alert(
                        'Confirm Emergency',
                        `Send ${item.label} emergency request now?`,
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Send',
                            style: 'destructive',
                            onPress: handleSubmit,
                          },
                        ]
                      );
                    } else {
                      setSelectedType(item.type);
                      setDescription(item.type);
                    }
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
                    numberOfLines={1}
                    adjustsFontSizeToFit
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    backgroundColor: LIGHT_GRAY,
  },
  headerContent: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 20,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 24,
  },
  headerLine: {
    width: 28,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 3,
    marginBottom: 3,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '600',
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
    paddingBottom: 48,
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
  // Search — high z-index so dropdown floats above map
  searchSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 2,
    zIndex: 999,
    elevation: 999,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  dropdown: {
    backgroundColor: OFF_WHITE,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 13,
    color: '#1a1a1a',
    lineHeight: 18,
  },
  // Map
  mapContainer: {
    height: 220,
    marginTop: 14,
    marginHorizontal: 20,
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
    bottom: 12,
    right: 12,
    width: 40,
    height: 40,
    backgroundColor: OFF_WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerArrow: {
    width: 10,
    height: 10,
    backgroundColor: PRIMARY,
    transform: [{ rotate: '45deg' }],
    marginTop: -5,
  },
  // Location info
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#FEF2F2',
    marginHorizontal: 20,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: SIGNAL_RED,
  },
  locationIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  locationCoords: {
    fontSize: 12,
    color: '#1a1a1a',
    fontWeight: '500',
    lineHeight: 17,
  },
  locationCoordsSmall: {
    fontSize: 10,
    color: MID_GRAY,
    fontWeight: '400',
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  locationResolvingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationResolving: {
    fontSize: 10,
    color: MID_GRAY,
    letterSpacing: 1,
  },
  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    marginLeft: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  typeCardActive: {
    backgroundColor: '#FEF2F2',
  },
  typeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  typeLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  descriptionInput: {
    backgroundColor: LIGHT_GRAY,
    padding: 14,
    fontSize: 14,
    color: '#1a1a1a',
    minHeight: 96,
    textAlignVertical: 'top',
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SIGNAL_RED,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 17,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: MID_GRAY,
  },
  submitButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: OFF_WHITE,
    letterSpacing: 2,
  },
  disclaimer: {
    fontSize: 10,
    color: MID_GRAY,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 24,
    letterSpacing: 0.5,
  },
});
