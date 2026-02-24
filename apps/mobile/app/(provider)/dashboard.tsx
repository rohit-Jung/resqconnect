import { Ionicons } from '@expo/vector-icons';

import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';

import SafeAreaContainer from '@/components/SafeAreaContainer';
import { SocketEvents } from '@/constants/socket.constants';
import { TEST_CORDS } from '@/constants/test.constants';
import { newEmergencyEventPayloadSchema } from '@/lib/validations/socket';
import { serviceProviderApi } from '@/services/provider/provider.api';
import { socketManager } from '@/socket/socket-manager';
import { IncomingRequest, useProviderStore } from '@/store/providerStore';

const STATUS_COLORS = {
  available: '#22c55e',
  assigned: '#f59e0b',
  off_duty: '#6b7280',
};

const STATUS_LABELS = {
  available: 'Available',
  assigned: 'On Assignment',
  off_duty: 'Off Duty',
};

const EMERGENCY_ICONS: Record<string, string> = {
  ambulance: '🚑',
  police: '🚔',
  fire_truck: '🚒',
  rescue_team: '🆘',
};

export default function ProviderDashboardScreen() {
  const router = useRouter();
  const {
    provider,
    serviceStatus,
    setServiceStatus,
    incomingRequests,
    currentRequest,
    setCurrentRequest,
    removeIncomingRequest,
    addIncomingRequest,
  } = useProviderStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for incoming requests
  useEffect(() => {
    if (incomingRequests.length > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      Vibration.vibrate([0, 500, 200, 500]); // Vibrate on new request
      return () => pulse.stop();
    }
  }, [incomingRequests.length, pulseAnim]);

  useEffect(() => {
    const handleNewEmergency = (data: any) => {
      console.log('NEW_EMERGENCY event received:', data);
      const parsedData = newEmergencyEventPayloadSchema.safeParse(data);
      if (!parsedData.success) {
        console.error(
          'Error validating emergency data:',
          JSON.stringify(parsedData.error.issues)
        );
        return;
      }
      console.log('Emergency data validated, adding to requests');

      // Transform the data to include computed properties for UI
      const requestData = {
        ...parsedData.data,
        location: parsedData.data.emergencyLocation,
        description: parsedData.data.emergencyDescription,
      };
      addIncomingRequest(requestData);
    };

    const handleRequestTaken = (data: any) => {
      console.log('Request taken by another provider:', data);
      removeIncomingRequest(data.requestId);
      if (currentRequest?.requestId === data.requestId) {
        setCurrentRequest(null);
        Alert.alert(
          'Request Taken',
          'This request was accepted by another provider.'
        );
      }
    };

    const handleRequestCancelled = (data: any) => {
      console.log('Request cancelled:', data);
      removeIncomingRequest(data.requestId);
      if (currentRequest?.requestId === data.requestId) {
        setCurrentRequest(null);
        Alert.alert(
          'Request Cancelled',
          'The user has cancelled this emergency request.'
        );
      }
    };

    socketManager.on(SocketEvents.NEW_EMERGENCY, handleNewEmergency);
    socketManager.on(SocketEvents.REQUEST_ACCEPTED, handleRequestTaken);
    socketManager.on(SocketEvents.REQUEST_CANCELLED, handleRequestCancelled);

    return () => {
      socketManager.off(SocketEvents.NEW_EMERGENCY, handleNewEmergency);
      socketManager.off(SocketEvents.REQUEST_ACCEPTED, handleRequestTaken);
      socketManager.off(SocketEvents.REQUEST_CANCELLED, handleRequestCancelled);
    };
  }, [
    currentRequest,
    addIncomingRequest,
    removeIncomingRequest,
    setCurrentRequest,
  ]);

  useEffect(() => {
    if (serviceStatus !== 'available') return;

    let interval: NodeJS.Timeout;

    const updateLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        console.log(
          'Current Location: ',
          location.coords.longitude,
          location.coords.latitude
        );
        console.log(
          'Test Location: ',
          TEST_CORDS.latitude,
          TEST_CORDS.longitude
        );
        // TODO: USING Test coordinates
        // await serviceProviderApi.updateLocation(
        //   location.coords.latitude,
        //   location.coords.longitude,
        // );

        await serviceProviderApi.updateLocation(
          TEST_CORDS.latitude,
          TEST_CORDS.longitude
        );

        // Emit via socketManager
        if (socketManager.isConnected()) {
          socketManager.emit(SocketEvents.LOCATION_UPDATE, {
            providerId: provider?.id,
            latitude: TEST_CORDS.latitude,
            longitude: TEST_CORDS.longitude,
          });
        }
      } catch (error) {
        console.error('Failed to update location:', error);
      }
    };

    updateLocation();
    interval = setInterval(updateLocation, 30 * 1000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [serviceStatus, provider?.id]);

  const handleStatusChange = async (
    newStatus: 'available' | 'assigned' | 'off_duty'
  ) => {
    if (newStatus === serviceStatus) return;

    try {
      setIsLoading(true);
      await serviceProviderApi.updateStatus(newStatus);
      setServiceStatus(newStatus);

      // Emit status change via socketManager
      if (socketManager.isConnected()) {
        socketManager.emit(SocketEvents.UPDATE_STATUS, {
          providerId: provider?.id,
          status: newStatus,
        });
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to update status'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptRequest = async (request: IncomingRequest) => {
    try {
      setIsAccepting(true);

      // Use HTTP endpoint (more reliable with proper error handling)
      await serviceProviderApi.acceptRequest(request.requestId);

      setCurrentRequest(request);
      removeIncomingRequest(request.requestId);
      setServiceStatus('assigned');

      Alert.alert(
        'Request Accepted',
        'Navigate to the emergency location now.',
        [
          {
            text: 'Start Tracking',
            onPress: () => {
              // Navigate to the tracking screen with provider role
              router.push({
                pathname: '/emergency-tracking',
                params: {
                  requestId: request.requestId,
                  emergencyType: request.emergencyType,
                  latitude: request.location.latitude.toString(),
                  longitude: request.location.longitude.toString(),
                  role: 'provider',
                },
              });
            },
          },
          {
            text: 'Open External Maps',
            onPress: () =>
              openMaps(request.location.latitude, request.location.longitude),
          },
        ]
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Failed to accept request';
      const status = error?.response?.status;

      // Handle specific error cases
      if (status === 409) {
        Alert.alert(
          'Request Taken',
          'This request was already accepted by another provider.'
        );
        removeIncomingRequest(request.requestId);
      } else if (status === 410) {
        Alert.alert(
          'Request Cancelled',
          'This request was cancelled by the user.'
        );
        removeIncomingRequest(request.requestId);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectRequest = (request: IncomingRequest) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this emergency request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await serviceProviderApi.rejectRequest(request.requestId);
              removeIncomingRequest(request.requestId);
            } catch {
              // Still remove from UI even if API fails
              removeIncomingRequest(request.requestId);
            }
          },
        },
      ]
    );
  };

  const handleCompleteRequest = () => {
    if (!currentRequest) return;

    Alert.alert(
      'Complete Request',
      'Mark this emergency request as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              // Use HTTP endpoint
              await serviceProviderApi.completeRequest(
                currentRequest.requestId
              );
              setCurrentRequest(null);
              setServiceStatus('available');
              Alert.alert('Success', 'Request completed successfully!');
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.response?.data?.message || 'Failed to complete request'
              );
            }
          },
        },
      ]
    );
  };

  const openMaps = (lat: number, lng: number) => {
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    Linking.openURL(url);
  };

  const renderStatusSelector = () => (
    <View
      className="mb-6 rounded-2xl bg-white p-4 shadow-sm"
      style={{ elevation: 2 }}
    >
      <Text
        className="mb-3 text-sm font-medium text-gray-700"
        style={{ fontFamily: 'Inter' }}
      >
        Your Status
      </Text>
      <View className="flex-row justify-between">
        {(['available', 'assigned', 'off_duty'] as const).map(status => (
          <TouchableOpacity
            key={status}
            onPress={() => handleStatusChange(status)}
            disabled={isLoading || (status === 'assigned' && !currentRequest)}
            className={`mx-1 flex-1 items-center rounded-xl py-3 ${
              serviceStatus === status ? 'border-2' : 'bg-gray-100'
            }`}
            style={{
              borderColor:
                serviceStatus === status
                  ? STATUS_COLORS[status]
                  : 'transparent',
              backgroundColor:
                serviceStatus === status
                  ? `${STATUS_COLORS[status]}20`
                  : '#f3f4f6',
            }}
          >
            <View
              className="mb-1 h-3 w-3 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
            <Text
              className={`text-xs ${serviceStatus === status ? 'font-semibold' : ''}`}
              style={{
                fontFamily: 'Inter',
                color:
                  serviceStatus === status ? STATUS_COLORS[status] : '#6b7280',
              }}
            >
              {STATUS_LABELS[status]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCurrentRequest = () => {
    if (!currentRequest) return null;

    return (
      <View
        className="mb-6 rounded-2xl bg-amber-50 p-4 shadow-sm"
        style={{
          elevation: 2,
          borderLeftWidth: 4,
          borderLeftColor: '#f59e0b',
        }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <Text
            className="text-lg text-amber-800"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Current Assignment
          </Text>
          <Text className="text-2xl">
            {EMERGENCY_ICONS[currentRequest.emergencyType]}
          </Text>
        </View>

        <View className="mb-3">
          <Text
            className="text-base font-medium text-gray-800"
            style={{ fontFamily: 'Inter' }}
          >
            {currentRequest.emergencyType.toUpperCase()} Emergency
          </Text>
          {currentRequest.description && (
            <Text
              className="mt-1 text-sm text-gray-600"
              style={{ fontFamily: 'Inter' }}
            >
              {currentRequest.description}
            </Text>
          )}
          {currentRequest.username && (
            <Text
              className="mt-1 text-sm text-gray-500"
              style={{ fontFamily: 'Inter' }}
            >
              User: {currentRequest.username}
            </Text>
          )}
        </View>

        <View className="flex-row">
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/emergency-tracking',
                params: {
                  requestId: currentRequest.requestId,
                  emergencyType: currentRequest.emergencyType,
                  latitude: currentRequest.location.latitude.toString(),
                  longitude: currentRequest.location.longitude.toString(),
                  role: 'provider',
                },
              })
            }
            className="mr-2 flex-1 flex-row items-center justify-center rounded-xl bg-blue-500 py-3"
          >
            <Ionicons name="navigate-outline" size={20} color="#fff" />
            <Text
              className="ml-2 font-semibold text-white"
              style={{ fontFamily: 'Inter' }}
            >
              Track
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCompleteRequest}
            className="flex-1 flex-row items-center justify-center rounded-xl bg-green-500 py-3"
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text
              className="ml-2 font-semibold text-white"
              style={{ fontFamily: 'Inter' }}
            >
              Complete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderIncomingRequest = (request: IncomingRequest) => (
    <Animated.View
      key={request.requestId}
      style={{ transform: [{ scale: pulseAnim }] }}
      className="mb-4 rounded-2xl bg-red-50 p-4 shadow-md"
    >
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Text className="mr-2 text-2xl">
            {EMERGENCY_ICONS[request.emergencyType]}
          </Text>
          <View>
            <Text
              className="text-base font-semibold text-red-800"
              style={{ fontFamily: 'Inter' }}
            >
              {request.emergencyType.toUpperCase()}
            </Text>
            <Text
              className="text-sm text-red-600"
              style={{ fontFamily: 'Inter' }}
            >
              {/* FIX: Add ETA */}
              {/* {request.distance.toFixed(1)} km away */}
              20 km away
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text
            className="text-xs text-gray-500"
            style={{ fontFamily: 'Inter' }}
          >
            {/* {new Date(request.createdAt).toLocaleTimeString()} */}
            {/* FIX: Add created at */}
            {new Date(Date.now()).toLocaleTimeString()}
          </Text>
        </View>
      </View>

      {request.description && (
        <Text
          className="mb-3 text-sm text-gray-700"
          style={{ fontFamily: 'Inter' }}
        >
          {request.description}
        </Text>
      )}

      <View className="flex-row">
        <TouchableOpacity
          onPress={() => handleAcceptRequest(request)}
          disabled={isAccepting}
          className="mr-2 flex-1 flex-row items-center justify-center rounded-xl bg-green-500 py-3"
        >
          {isAccepting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text
                className="ml-2 font-semibold text-white"
                style={{ fontFamily: 'Inter' }}
              >
                Accept
              </Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleRejectRequest(request)}
          className="flex-1 flex-row items-center justify-center rounded-xl bg-gray-400 py-3"
        >
          <Ionicons name="close" size={20} color="#fff" />
          <Text
            className="ml-2 font-semibold text-white"
            style={{ fontFamily: 'Inter' }}
          >
            Reject
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  // ✅ Get connection status from socketManager
  const isConnected = socketManager.isConnected();

  return (
    <SafeAreaContainer>
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-primary px-6 pb-4 pt-2">
          <View className="flex-row items-center justify-between">
            <View>
              <Text
                className="text-2xl text-white"
                style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
              >
                Provider Dashboard
              </Text>
              <Text
                className="text-sm text-white/80"
                style={{ fontFamily: 'Inter' }}
              >
                {provider?.name || 'Provider'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <View
                className={`mr-2 h-3 w-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}
              />
              <TouchableOpacity
                onPress={() => router.push('/(provider)/profile')}
                className="rounded-full bg-white/20 p-2"
              >
                <Ionicons name="person-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Status Selector */}
          {renderStatusSelector()}

          {/* Current Assignment */}
          {renderCurrentRequest()}

          {/* Incoming Requests */}
          {incomingRequests.length > 0 && (
            <View className="mb-6">
              <Text
                className="mb-3 text-lg text-gray-800"
                style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
              >
                🚨 Incoming Requests ({incomingRequests.length})
              </Text>
              {incomingRequests.map(renderIncomingRequest)}
            </View>
          )}

          {/* Empty State */}
          {serviceStatus === 'available' &&
            !currentRequest &&
            incomingRequests.length === 0 && (
              <View className="items-center justify-center py-12">
                <Ionicons name="radio-outline" size={64} color="#d1d5db" />
                <Text
                  className="mt-4 text-center text-lg text-gray-400"
                  style={{ fontFamily: 'Inter' }}
                >
                  Listening for emergencies...
                </Text>
                <Text
                  className="mt-1 text-center text-sm text-gray-400"
                  style={{ fontFamily: 'Inter' }}
                >
                  {"You'll be notified when there's an emergency nearby"}
                </Text>
              </View>
            )}

          {serviceStatus === 'off_duty' && (
            <View className="items-center justify-center py-12">
              <Ionicons name="moon-outline" size={64} color="#d1d5db" />
              <Text
                className="mt-4 text-center text-lg text-gray-400"
                style={{ fontFamily: 'Inter' }}
              >
                {"You're currently off duty"}
              </Text>
              <Text
                className="mt-1 text-center text-sm text-gray-400"
                style={{ fontFamily: 'Inter' }}
              >
                {'Switch to "Available" to receive emergency requests'}
              </Text>
            </View>
          )}

          <View className="h-8" />
        </ScrollView>
      </View>
    </SafeAreaContainer>
  );
}
