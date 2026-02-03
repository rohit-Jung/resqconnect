import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCreateEmergencyRequest } from '@/services/emergency/emergency.api';
import { TEmergencyType } from '@/validations/emergency.schema';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

const EMERGENCY_TYPES: { type: TEmergencyType; label: string; icon: string; color: string }[] = [
  { type: 'ambulance', label: 'Medical', icon: 'ambulance', color: '#EF4444' },
  { type: 'police', label: 'Police', icon: 'shield-account', color: '#3B82F6' },
  { type: 'fire_truck', label: 'Fire', icon: 'fire-truck', color: '#F97316' },
  { type: 'rescue_team', label: 'Rescue', icon: 'lifebuoy', color: '#10B981' },
];

export default function EmergencyRequestScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [selectedType, setSelectedType] = useState<TEmergencyType | null>(null);
  const [description, setDescription] = useState('');
  const [markerLocation, setMarkerLocation] = useState<LocationCoords | null>(null);

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

    createEmergency(
      {
        emergencyType: selectedType,
        emergencyDescription: description,
        userLocation: markerLocation,
      },
      {
        onSuccess: (response) => {
          const requestId = response.data?.data?.emergencyRequest?.id;
          // Navigate to tracking screen to show nearby providers and status
          router.replace({
            pathname: '/emergency-tracking',
            params: {
              requestId,
              emergencyType: selectedType,
              latitude: markerLocation.latitude.toString(),
              longitude: markerLocation.longitude.toString(),
            },
          });
        },
        onError: (error: any) => {
          Alert.alert(
            'Error',
            error.response?.data?.message || 'Failed to create emergency request. Please try again.'
          );
        },
      }
    );
  };

  if (isLoadingLocation) {
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
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-100 px-4 py-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text
            className="text-xl text-gray-800"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
            Emergency Request
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Map */}
          <View className="h-64 overflow-hidden">
            {location ? (
              <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: location.latitude,
                  longitude: location.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={handleMapPress}
                showsUserLocation
                showsMyLocationButton={false}>
                {markerLocation && (
                  <Marker
                    coordinate={markerLocation}
                    draggable
                    onDragEnd={(e) => setMarkerLocation(e.nativeEvent.coordinate)}>
                    <View className="items-center">
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary shadow-lg">
                        <Ionicons name="location" size={24} color="white" />
                      </View>
                      <View className="-mt-1.5 h-3 w-3 rotate-45 bg-primary" />
                    </View>
                  </Marker>
                )}
              </MapView>
            ) : (
              <View className="flex-1 items-center justify-center bg-gray-100">
                <Ionicons name="location-outline" size={48} color="#9CA3AF" />
                <Text className="mt-2 text-gray-500" style={{ fontFamily: 'Inter' }}>
                  Location unavailable
                </Text>
              </View>
            )}

            {/* Center Location Button */}
            <TouchableOpacity
              onPress={centerOnCurrentLocation}
              className="absolute bottom-4 right-4 h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
              <Ionicons name="locate" size={24} color="#E13333" />
            </TouchableOpacity>
          </View>

          {/* Location Info */}
          <View className="mx-4 mt-4 flex-row items-center rounded-xl bg-gray-50 p-3">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Ionicons name="location" size={20} color="#E13333" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-xs text-gray-500" style={{ fontFamily: 'Inter' }}>
                Emergency Location
              </Text>
              <Text className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Inter' }}>
                {markerLocation
                  ? `${markerLocation.latitude.toFixed(6)}, ${markerLocation.longitude.toFixed(6)}`
                  : 'Tap on map to set location'}
              </Text>
            </View>
          </View>

          {/* Emergency Type Selection */}
          <View className="px-4 pt-6">
            <Text
              className="mb-3 text-lg text-gray-800"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
              Type of Emergency
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {EMERGENCY_TYPES.map((item) => (
                <TouchableOpacity
                  key={item.type}
                  onPress={() => setSelectedType(item.type)}
                  className={`mb-3 w-[48%] items-center rounded-xl p-4 ${
                    selectedType === item.type
                      ? 'border-2 border-primary bg-primary/5'
                      : 'bg-gray-50'
                  }`}
                  disabled={isPending}>
                  <View
                    className="mb-2 h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${item.color}20` }}>
                    <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />
                  </View>
                  <Text
                    className={`text-sm ${
                      selectedType === item.type ? 'font-semibold text-primary' : 'text-gray-600'
                    }`}
                    style={{ fontFamily: 'Inter' }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View className="px-4 pt-4">
            <Text
              className="mb-3 text-lg text-gray-800"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
              Describe Your Emergency
            </Text>
            <TextInput
              className="h-28 rounded-xl bg-gray-50 p-4 text-base text-gray-800"
              style={{ fontFamily: 'Inter', textAlignVertical: 'top' }}
              placeholder="Please provide details about your emergency..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              editable={!isPending}
            />
          </View>

          {/* Submit Button */}
          <View className="p-4 pb-8">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isPending || !selectedType || !description.trim()}
              className={`h-14 flex-row items-center justify-center rounded-xl shadow-lg ${
                isPending || !selectedType || !description.trim() ? 'bg-gray-300' : 'bg-primary'
              }`}>
              {isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="alert-circle" size={24} color="white" />
                  <Text
                    className="ml-2 text-lg font-semibold text-white"
                    style={{ fontFamily: 'Inter' }}>
                    Send Emergency Request
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <Text
              className="mt-3 text-center text-xs text-gray-500"
              style={{ fontFamily: 'Inter' }}>
              Your location will be shared with emergency responders
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
