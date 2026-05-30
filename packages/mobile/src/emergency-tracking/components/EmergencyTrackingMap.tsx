import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { View } from 'react-native';
import MapView, {
  LatLng,
  Marker,
  PROVIDER_GOOGLE,
  Polyline,
} from 'react-native-maps';

import { MAP_CONFIG } from '../constants';
import { emergencyTrackingMapStyles as styles } from '../stylesheet';
import type { EmergencyIconInfo, LocationCoords } from '../types';

type NearbyProviderMarker = {
  id: string;
  currentLocation: { latitude: string; longitude: string };
};

export function EmergencyTrackingMap({
  mapRef,
  mapReady,
  onMapReady,
  initialRegion,
  userLocation,
  providerLocation,
  nearbyProviders,
  remainingRouteCoordinates,
  emergencyInfo,
}: {
  mapRef: RefObject<MapView | null>;
  mapReady: boolean;
  onMapReady: () => void;
  initialRegion: LocationCoords & {
    latitudeDelta: number;
    longitudeDelta: number;
  };
  userLocation: LocationCoords;
  providerLocation: LocationCoords | null;
  nearbyProviders?: NearbyProviderMarker[];
  remainingRouteCoordinates: LatLng[];
  emergencyInfo: EmergencyIconInfo;
}) {
  const didInitialFitRef = useRef(false);
  const userInteractedRef = useRef(false);

  const markUserInteracted = () => {
    userInteractedRef.current = true;
  };

  // Fit both markers only once on first load (unless user already interacted).
  useEffect(() => {
    if (!mapReady) return;
    if (!mapRef.current) return;
    if (didInitialFitRef.current) return;
    if (userInteractedRef.current) return;

    const coordinates: LocationCoords[] = [];

    // Avoid treating 0 as falsy, and keep TS happy about required numbers.
    if (
      Number.isFinite(userLocation.latitude) &&
      Number.isFinite(userLocation.longitude)
    ) {
      coordinates.push({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
    }

    if (
      providerLocation &&
      Number.isFinite(providerLocation.latitude) &&
      Number.isFinite(providerLocation.longitude)
    ) {
      coordinates.push({
        latitude: providerLocation.latitude,
        longitude: providerLocation.longitude,
      });
    }

    if (coordinates.length > 1) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: MAP_CONFIG.FIT_TO_COORDINATES_PADDING,
        animated: true,
      });
      didInitialFitRef.current = true;
    } else if (coordinates.length === 1) {
      const only = coordinates[0];
      if (!only) return;
      mapRef.current.animateToRegion({
        ...only,
        latitudeDelta: MAP_CONFIG.INITIAL_DELTA.latitudeDelta,
        longitudeDelta: MAP_CONFIG.INITIAL_DELTA.longitudeDelta,
      });
      didInitialFitRef.current = true;
    }
  }, [mapReady, mapRef, userLocation, providerLocation]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion}
      onMapReady={onMapReady}
      onPanDrag={markUserInteracted}
      onTouchStart={markUserInteracted}
      showsUserLocation={false}
      showsMyLocationButton={false}
    >
      <Marker
        coordinate={userLocation}
        anchor={{ x: 0.5, y: 0.5 }}
        identifier="user"
      >
        <View style={[styles.userMarker, { borderColor: emergencyInfo.color }]}>
          <MaterialCommunityIcons
            name="account-alert"
            size={20}
            color={emergencyInfo.color}
          />
        </View>
      </Marker>

      {!!nearbyProviders?.length &&
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
  );
}
