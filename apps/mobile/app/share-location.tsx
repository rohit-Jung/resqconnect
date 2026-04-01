import { Ionicons } from '@expo/vector-icons';

import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/authStore';
import { formatShareMessage, getGoogleMapsLink } from '@/utils/sms.utils';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function ShareLocationScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const { user } = useAuthStore();

  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLocation = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setIsRefreshing(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'PERMISSION DENIED',
          'Location permission is required to share your location.'
        );
        setIsLoading(false);
        setIsRefreshing(false);
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

      try {
        const [addressResult] = await Location.reverseGeocodeAsync(coords);
        if (addressResult) {
          const parts = [
            addressResult.street,
            addressResult.city,
            addressResult.region,
            addressResult.postalCode,
          ].filter(Boolean);
          setAddress(parts.join(', '));
        }
      } catch (error) {
        console.log('Error getting address:', error);
        setAddress('');
      }

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      Alert.alert('ERROR', 'Failed to get your location. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const handleShare = async () => {
    if (!location) {
      Alert.alert('ERROR', 'Location not available');
      return;
    }

    const mapsLink = getGoogleMapsLink(location.latitude, location.longitude);
    const message = `My current location:\n${address ? address + '\n' : ''}${mapsLink}\n\nShared via ResQ Connect`;

    try {
      await Share.share({
        message,
        title: 'My Location',
      });
    } catch (error) {
      Alert.alert('ERROR', 'Failed to share location');
    }
  };

  const handleCopyCoordinates = () => {
    if (!location) return;

    const coords = `${location.latitude}, ${location.longitude}`;
    Clipboard.setString(coords);
    Alert.alert('COPIED', 'Coordinates copied to clipboard');
  };

  const handleCopyLink = () => {
    if (!location) return;

    const link = getGoogleMapsLink(location.latitude, location.longitude);
    Clipboard.setString(link);
    Alert.alert('COPIED', 'Google Maps link copied to clipboard');
  };

  const handleShareViaApp = (app: string) => {
    if (!location) return;

    const mapsLink = getGoogleMapsLink(location.latitude, location.longitude);
    const message = encodeURIComponent(
      `My location: ${address ? address + ' - ' : ''}${mapsLink}`
    );

    let url = '';
    switch (app) {
      case 'whatsapp':
        url = `whatsapp://send?text=${message}`;
        break;
      case 'sms':
        url = `sms:?body=${message}`;
        break;
      case 'email':
        url = `mailto:?subject=My Location&body=${message}`;
        break;
    }

    if (url) {
      import('react-native').then(({ Linking }) => {
        Linking.openURL(url).catch(() => {
          Alert.alert('ERROR', `Unable to open ${app}`);
        });
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={SIGNAL_RED} />
        <Text style={styles.loadingText}>GETTING YOUR LOCATION...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Swiss style */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>RESQ</Text>
            <Text style={styles.brandDot}>.</Text>
          </View>
          <View style={styles.headerLine} />
          <Text style={styles.tagline}>SHARE LOCATION</Text>
        </View>
        <TouchableOpacity
          onPress={() => fetchLocation(false)}
          style={styles.refreshButton}
          disabled={isRefreshing}
          activeOpacity={0.7}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={BLACK} />
          ) : (
            <Ionicons name="refresh" size={20} color={BLACK} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Map */}
        <View style={styles.mapContainer}>
          {location ? (
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                ...location,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation
              showsMyLocationButton={false}
            >
              <Marker coordinate={location}>
                <View style={styles.markerContainer}>
                  <View style={styles.markerInner}>
                    <Ionicons name="location" size={24} color={OFF_WHITE} />
                  </View>
                  <View style={styles.markerArrow} />
                </View>
              </Marker>
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="location-outline" size={48} color={MID_GRAY} />
              <Text style={styles.mapPlaceholderText}>
                LOCATION UNAVAILABLE
              </Text>
            </View>
          )}
        </View>

        {/* Location Info Card */}
        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={24} color={SIGNAL_RED} />
            </View>
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>YOUR CURRENT LOCATION</Text>
              <Text style={styles.locationAddress} numberOfLines={2}>
                {address || 'Address unavailable'}
              </Text>
            </View>
          </View>

          {location && (
            <View style={styles.coordinatesRow}>
              <Text style={styles.coordinatesText}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
              <TouchableOpacity onPress={handleCopyCoordinates}>
                <Ionicons name="copy-outline" size={18} color={MID_GRAY} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Share Options */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SHARE VIA</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.shareGrid}>
            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => handleShareViaApp('whatsapp')}
              activeOpacity={0.7}
            >
              <View style={[styles.shareIcon, { backgroundColor: '#25D366' }]}>
                <Ionicons name="logo-whatsapp" size={28} color={OFF_WHITE} />
              </View>
              <Text style={styles.shareLabel}>WHATSAPP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => handleShareViaApp('sms')}
              activeOpacity={0.7}
            >
              <View style={[styles.shareIcon, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="chatbubble" size={28} color={OFF_WHITE} />
              </View>
              <Text style={styles.shareLabel}>SMS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={() => handleShareViaApp('email')}
              activeOpacity={0.7}
            >
              <View style={[styles.shareIcon, { backgroundColor: '#6B7280' }]}>
                <Ionicons name="mail" size={28} color={OFF_WHITE} />
              </View>
              <Text style={styles.shareLabel}>EMAIL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareOption}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <View style={[styles.shareIcon, { backgroundColor: PRIMARY }]}>
                <Ionicons name="share-social" size={28} color={OFF_WHITE} />
              </View>
              <Text style={styles.shareLabel}>MORE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Copy Link Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.copyLinkButton}
            onPress={handleCopyLink}
            activeOpacity={0.7}
          >
            <Ionicons name="link-outline" size={20} color={BLACK} />
            <Text style={styles.copyLinkText}>COPY GOOGLE MAPS LINK</Text>
          </TouchableOpacity>
        </View>

        {/* Main Share Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            disabled={!location}
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={24} color={OFF_WHITE} />
            <Text style={styles.shareButtonText}>SHARE MY LOCATION</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
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
    color: BLACK,
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
  refreshButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 24,
    padding: 8,
    backgroundColor: LIGHT_GRAY,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
  locationCard: {
    marginHorizontal: 24,
    marginTop: -40,
    backgroundColor: OFF_WHITE,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    padding: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    fontWeight: '500',
    color: BLACK,
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: LIGHT_GRAY,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coordinatesText: {
    fontSize: 12,
    color: MID_GRAY,
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
  shareGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareOption: {
    alignItems: 'center',
    flex: 1,
  },
  shareIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shareLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 1,
  },
  copyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OFF_WHITE,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    paddingVertical: 16,
  },
  copyLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: BLACK,
    letterSpacing: 1,
    marginLeft: 8,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
    paddingVertical: 16,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 2,
    marginLeft: 8,
  },
});
