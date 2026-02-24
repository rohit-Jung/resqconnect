import { Ionicons } from '@expo/vector-icons';

import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/store/authStore';
import { formatShareMessage, getGoogleMapsLink } from '@/utils/sms.utils';

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
          'Permission Denied',
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

      // Get address from coordinates
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

      // Center map on location
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          ...coords,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get your location. Please try again.');
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
      Alert.alert('Error', 'Location not available');
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
      Alert.alert('Error', 'Failed to share location');
    }
  };

  const handleCopyCoordinates = () => {
    if (!location) return;

    const coords = `${location.latitude}, ${location.longitude}`;
    Clipboard.setString(coords);
    Alert.alert('Copied!', 'Coordinates copied to clipboard');
  };

  const handleCopyLink = () => {
    if (!location) return;

    const link = getGoogleMapsLink(location.latitude, location.longitude);
    Clipboard.setString(link);
    Alert.alert('Copied!', 'Google Maps link copied to clipboard');
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
          Alert.alert('Error', `Unable to open ${app}`);
        });
      });
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#E13333" />
        <Text className="mt-4 text-gray-600" style={{ fontFamily: 'Inter' }}>
          Getting your location...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between bg-primary px-4 pb-4 pt-2">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white/20"
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text
            className="text-2xl text-white"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Share Location
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => fetchLocation(false)}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="refresh" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Map */}
        <View className="h-64">
          {location ? (
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
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
                <View className="items-center">
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg">
                    <Ionicons name="location" size={24} color="white" />
                  </View>
                  <View className="-mt-1.5 h-3 w-3 rotate-45 bg-primary" />
                </View>
              </Marker>
            </MapView>
          ) : (
            <View className="flex-1 items-center justify-center bg-gray-100">
              <Ionicons name="location-outline" size={48} color="#9CA3AF" />
              <Text
                className="mt-2 text-gray-500"
                style={{ fontFamily: 'Inter' }}
              >
                Location unavailable
              </Text>
            </View>
          )}
        </View>

        {/* Location Info Card */}
        <View
          className="mx-4 -mt-6 rounded-2xl bg-white p-4 shadow-lg"
          style={{ elevation: 4 }}
        >
          <View className="flex-row items-center mb-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="location" size={24} color="#E13333" />
            </View>
            <View className="ml-3 flex-1">
              <Text
                className="text-xs text-gray-500"
                style={{ fontFamily: 'Inter' }}
              >
                Your Current Location
              </Text>
              <Text
                className="text-sm font-medium text-gray-800"
                style={{ fontFamily: 'Inter' }}
                numberOfLines={2}
              >
                {address || 'Address unavailable'}
              </Text>
            </View>
          </View>

          {location && (
            <View className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <Text
                className="text-xs text-gray-600"
                style={{ fontFamily: 'Inter' }}
              >
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </Text>
              <TouchableOpacity onPress={handleCopyCoordinates}>
                <Ionicons name="copy-outline" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Share Options */}
        <View className="px-4 pt-6">
          <Text
            className="mb-4 text-lg text-gray-800"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Share via
          </Text>

          <View className="flex-row justify-between mb-4">
            <TouchableOpacity
              onPress={() => handleShareViaApp('whatsapp')}
              className="items-center flex-1"
            >
              <View className="h-14 w-14 items-center justify-center rounded-full bg-green-500">
                <Ionicons name="logo-whatsapp" size={28} color="#fff" />
              </View>
              <Text
                className="mt-2 text-xs text-gray-600"
                style={{ fontFamily: 'Inter' }}
              >
                WhatsApp
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleShareViaApp('sms')}
              className="items-center flex-1"
            >
              <View className="h-14 w-14 items-center justify-center rounded-full bg-blue-500">
                <Ionicons name="chatbubble" size={28} color="#fff" />
              </View>
              <Text
                className="mt-2 text-xs text-gray-600"
                style={{ fontFamily: 'Inter' }}
              >
                SMS
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleShareViaApp('email')}
              className="items-center flex-1"
            >
              <View className="h-14 w-14 items-center justify-center rounded-full bg-red-500">
                <Ionicons name="mail" size={28} color="#fff" />
              </View>
              <Text
                className="mt-2 text-xs text-gray-600"
                style={{ fontFamily: 'Inter' }}
              >
                Email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              className="items-center flex-1"
            >
              <View className="h-14 w-14 items-center justify-center rounded-full bg-gray-700">
                <Ionicons name="share-social" size={28} color="#fff" />
              </View>
              <Text
                className="mt-2 text-xs text-gray-600"
                style={{ fontFamily: 'Inter' }}
              >
                More
              </Text>
            </TouchableOpacity>
          </View>

          {/* Copy Link Button */}
          <TouchableOpacity
            onPress={handleCopyLink}
            className="flex-row items-center justify-center rounded-xl border border-gray-200 bg-white py-4 mb-4"
          >
            <Ionicons name="link-outline" size={20} color="#374151" />
            <Text
              className="ml-2 text-gray-700 font-medium"
              style={{ fontFamily: 'Inter' }}
            >
              Copy Google Maps Link
            </Text>
          </TouchableOpacity>

          {/* Main Share Button */}
          <TouchableOpacity
            onPress={handleShare}
            className="flex-row items-center justify-center rounded-xl bg-primary py-4 mb-8"
            disabled={!location}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
            <Text
              className="ml-2 text-white font-semibold text-lg"
              style={{ fontFamily: 'Inter' }}
            >
              Share My Location
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
