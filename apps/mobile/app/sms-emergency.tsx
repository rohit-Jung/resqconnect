import { Ionicons } from '@expo/vector-icons';

import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SMS from 'expo-sms';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EMERGENCY_PHONE_NUMBER, SMS_FALLBACK_NUMBER } from '@/constants';
import { useAuthStore } from '@/store/authStore';
import {
  SMSEmergencyData,
  formatEmergencyMessage,
  formatEmergencyType,
  getGoogleMapsLink,
  getSMSFallbackNumber,
} from '@/utils/sms.utils';

const EMERGENCY_TYPES = [
  { value: 'ambulance', label: 'Medical', icon: 'medical', color: '#EF4444' },
  { value: 'police', label: 'Police', icon: 'shield', color: '#3B82F6' },
  { value: 'fire_truck', label: 'Fire', icon: 'flame', color: '#F97316' },
  { value: 'rescue_team', label: 'Rescue', icon: 'people', color: '#8B5CF6' },
] as const;

export default function SMSEmergencyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();

  const [selectedType, setSelectedType] = useState<string>(
    (params.emergencyType as string) || 'ambulance'
  );
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [smsAvailable, setSmsAvailable] = useState(true);

  useEffect(() => {
    const checkSMS = async () => {
      const isAvailable = await SMS.isAvailableAsync();
      setSmsAvailable(isAvailable);
    };
    checkSMS();
    getLocation();
  }, []);

  const getLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to send your location in the emergency SMS.'
        );
        setIsLoadingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    }
    setIsLoadingLocation(false);
  };

  const handleSendSMS = async () => {
    if (!location) {
      Alert.alert('Error', 'Location is required. Please wait or refresh.');
      return;
    }

    if (!smsAvailable) {
      Alert.alert(
        'SMS Not Available',
        'SMS is not available on this device. Please call emergency services instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call ' + EMERGENCY_PHONE_NUMBER,
            onPress: () => Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`),
          },
        ]
      );
      return;
    }

    setIsSending(true);

    try {
      const emergencyData: SMSEmergencyData = {
        emergencyType: selectedType,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        description: description.trim() || undefined,
        userName: user?.name,
        userPhone: user?.phoneNumber?.toString(),
        userId: user?.id, // Include userId for backend identification
      };

      const message = formatEmergencyMessage(emergencyData);
      const fallbackNumber = getSMSFallbackNumber();

      const { result } = await SMS.sendSMSAsync([fallbackNumber], message);

      if (result === 'sent') {
        Alert.alert(
          'Emergency SMS Sent',
          'Your emergency request has been sent via SMS. Help is on the way. You can also call emergency services directly.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
            {
              text: 'Call ' + EMERGENCY_PHONE_NUMBER,
              onPress: () => {
                Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`);
                router.back();
              },
            },
          ]
        );
      } else if (result === 'cancelled') {
        Alert.alert('Cancelled', 'SMS was not sent.');
      } else {
        // Unknown or unavailable
        Alert.alert(
          'SMS Status Unknown',
          'We could not confirm if the SMS was sent. Please try again or call emergency services.',
          [
            { text: 'Retry', onPress: () => setIsSending(false) },
            {
              text: 'Call ' + EMERGENCY_PHONE_NUMBER,
              onPress: () => Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert(
        'Error',
        'Failed to send SMS. Please call emergency services directly.',
        [
          { text: 'OK' },
          {
            text: 'Call ' + EMERGENCY_PHONE_NUMBER,
            onPress: () => Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`),
          },
        ]
      );
    }

    setIsSending(false);
  };

  const handleCallEmergency = () => {
    Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-amber-500 px-5 py-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text
              className="text-2xl text-white"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
            >
              Offline Emergency
            </Text>
            <Text
              className="text-sm text-white/80"
              style={{ fontFamily: 'Inter' }}
            >
              Send emergency via SMS
            </Text>
          </View>
        </View>
      </View>

      {/* Offline Banner */}
      <View className="bg-amber-100 px-5 py-3 flex-row items-center">
        <Ionicons name="cloud-offline" size={20} color="#D97706" />
        <Text
          className="ml-2 text-amber-800 flex-1"
          style={{ fontFamily: 'Inter' }}
        >
          You appear to be offline. Use SMS to request emergency help.
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Emergency Type Selection */}
        <View className="mb-6">
          <Text
            className="text-lg text-gray-800 mb-3"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Emergency Type
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {EMERGENCY_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setSelectedType(type.value)}
                className={`flex-1 min-w-[45%] rounded-2xl p-4 items-center ${
                  selectedType === type.value
                    ? 'border-2'
                    : 'bg-white border border-gray-200'
                }`}
                style={{
                  borderColor:
                    selectedType === type.value ? type.color : '#E5E7EB',
                  backgroundColor:
                    selectedType === type.value ? `${type.color}15` : '#fff',
                }}
              >
                <Ionicons
                  name={type.icon as any}
                  size={32}
                  color={selectedType === type.value ? type.color : '#6B7280'}
                />
                <Text
                  className={`mt-2 font-medium ${
                    selectedType === type.value
                      ? 'text-gray-800'
                      : 'text-gray-600'
                  }`}
                  style={{ fontFamily: 'Inter' }}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location Status */}
        <View className="mb-6">
          <Text
            className="text-lg text-gray-800 mb-3"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Your Location
          </Text>
          <View
            className="bg-white rounded-2xl p-4 shadow-sm"
            style={{ elevation: 2 }}
          >
            {isLoadingLocation ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#E13333" />
                <Text
                  className="ml-3 text-gray-600"
                  style={{ fontFamily: 'Inter' }}
                >
                  Getting your location...
                </Text>
              </View>
            ) : location ? (
              <View>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="location" size={20} color="#10B981" />
                  <Text
                    className="ml-2 text-green-600 font-medium"
                    style={{ fontFamily: 'Inter' }}
                  >
                    Location acquired
                  </Text>
                </View>
                <Text
                  className="text-gray-500 text-sm"
                  style={{ fontFamily: 'Inter' }}
                >
                  {location.coords.latitude.toFixed(6)},{' '}
                  {location.coords.longitude.toFixed(6)}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      getGoogleMapsLink(
                        location.coords.latitude,
                        location.coords.longitude
                      )
                    )
                  }
                  className="mt-2 flex-row items-center"
                >
                  <Ionicons name="map-outline" size={16} color="#3B82F6" />
                  <Text
                    className="ml-1 text-blue-500 text-sm"
                    style={{ fontFamily: 'Inter' }}
                  >
                    View on Maps
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View className="flex-row items-center mb-2">
                  <Ionicons name="location-outline" size={20} color="#EF4444" />
                  <Text
                    className="ml-2 text-red-500 font-medium"
                    style={{ fontFamily: 'Inter' }}
                  >
                    Location not available
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={getLocation}
                  className="bg-gray-100 rounded-lg py-2 px-4 self-start"
                >
                  <Text
                    className="text-gray-700"
                    style={{ fontFamily: 'Inter' }}
                  >
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View className="mb-6">
          <Text
            className="text-lg text-gray-800 mb-3"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Additional Details (Optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe your emergency..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            className="bg-white rounded-2xl p-4 text-gray-800 shadow-sm"
            style={{
              fontFamily: 'Inter',
              textAlignVertical: 'top',
              minHeight: 100,
              elevation: 2,
            }}
          />
        </View>

        {/* SMS Preview */}
        <View className="mb-6">
          <Text
            className="text-lg text-gray-800 mb-3"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            SMS Preview
          </Text>
          <View className="bg-gray-100 rounded-2xl p-4">
            <Text
              className="text-gray-600 text-sm"
              style={{ fontFamily: 'Inter' }}
            >
              To: {SMS_FALLBACK_NUMBER}
            </Text>
            <View className="h-px bg-gray-300 my-2" />
            <Text
              className="text-gray-800 text-sm"
              style={{ fontFamily: 'Inter' }}
            >
              [ResQ Connect EMERGENCY]{'\n'}
              Type: {formatEmergencyType(selectedType)}
              {'\n'}
              Location:{' '}
              {location
                ? `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`
                : 'Getting...'}
              {description ? `\nDetails: ${description}` : ''}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="px-5 pb-6 pt-3 bg-white border-t border-gray-100">
        <TouchableOpacity
          onPress={handleSendSMS}
          disabled={
            isSending || isLoadingLocation || !location || !smsAvailable
          }
          className={`rounded-2xl py-4 flex-row items-center justify-center mb-3 ${
            isSending || isLoadingLocation || !location || !smsAvailable
              ? 'bg-gray-300'
              : 'bg-primary'
          }`}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text
                className="ml-2 text-white font-bold text-lg"
                style={{ fontFamily: 'Inter' }}
              >
                Send Emergency SMS
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCallEmergency}
          className="rounded-2xl py-4 flex-row items-center justify-center bg-green-500"
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={20} color="#fff" />
          <Text
            className="ml-2 text-white font-bold text-lg"
            style={{ fontFamily: 'Inter' }}
          >
            Call {EMERGENCY_PHONE_NUMBER}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
