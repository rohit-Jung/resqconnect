import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { SocketEvents } from '@/constants/socket.constants';
import { socketManager } from '@/socket/socket-manager';
import { useProviderStore } from '@/store/providerStore';
import { IAssignedProvider } from '@/types/emergency.types';
import { mapboxToLatLng } from '@/utils/location.utils';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface UseSocketHandlersProps {
  requestId: string;
  isProvider: boolean;
  socket: any;
  onProviderLocationUpdate: (location: LocationCoords) => void;
  onUserLocationUpdate: (location: LocationCoords) => void;
  onProviderAccepted: (provider: IAssignedProvider, route?: any) => void;
  onEmergencyCompleted: () => void;
  onRouteCoordinatesUpdate: (coords: any[]) => void;
  onRouteInfoUpdate: (info: { distance: number; duration: number }) => void;
}

export const useSocketHandlers = ({
  requestId,
  isProvider,
  socket,
  onProviderLocationUpdate,
  onUserLocationUpdate,
  onProviderAccepted,
  onEmergencyCompleted,
  onRouteCoordinatesUpdate,
  onRouteInfoUpdate,
}: UseSocketHandlersProps) => {
  const router = useRouter();

  // Parse location from socket data
  const parseLocation = useCallback((location: any): LocationCoords | null => {
    const lat =
      typeof location.latitude === 'string'
        ? parseFloat(location.latitude)
        : location.latitude;
    const lng =
      typeof location.longitude === 'string'
        ? parseFloat(location.longitude)
        : location.longitude;

    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
    return null;
  }, []);

  // Handle provider location updates
  const handleProviderLocation = useCallback(
    (data: any) => {
      console.log('Provider location update:', data);
      if (data.location && !isProvider) {
        const location = parseLocation(data.location);
        if (location) {
          onProviderLocationUpdate(location);
        }
      }
    },
    [isProvider, parseLocation, onProviderLocationUpdate]
  );

  // Handle user location updates
  const handleUserLocation = useCallback(
    (data: any) => {
      console.log('User location update:', data);
      if (data.location && isProvider) {
        const location = parseLocation(data.location);
        if (location) {
          onUserLocationUpdate(location);
        }
      }
    },
    [isProvider, parseLocation, onUserLocationUpdate]
  );

  // Handle provider acceptance
  const handleProviderAccepted = useCallback(
    (data: any) => {
      console.log(
        'Provider accepted - full data:',
        JSON.stringify(data, null, 2)
      );

      if (data.provider) {
        const assignedProvider: IAssignedProvider = {
          id: data.provider.id,
          name: data.provider.name,
          serviceType: data.provider.serviceType,
          currentLocation: data.provider.location,
          distance: 0,
          phoneNumber: data.provider.phone,
          vehicleNumber: data.provider.vehicleNumber,
          estimatedArrival: data.route?.duration,
        };

        // Set provider location if available
        if (
          data.provider.location?.latitude &&
          data.provider.location?.longitude
        ) {
          const location = parseLocation(data.provider.location);
          if (location) {
            console.log('Setting provider location:', location);
            onProviderLocationUpdate(location);
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
          onRouteCoordinatesUpdate(coords);
          onRouteInfoUpdate({
            distance: data.route.distance,
            duration: data.route.duration,
          });
        } else {
          console.warn(
            'Route coordinates not available in acceptance data - will fetch when provider location updates'
          );
        }

        onProviderAccepted(assignedProvider, data.route);
      }
    },
    [
      parseLocation,
      onProviderLocationUpdate,
      onProviderAccepted,
      onRouteCoordinatesUpdate,
      onRouteInfoUpdate,
    ]
  );

  // Handle emergency completion
  const handleEmergencyCompleted = useCallback(() => {
    if (isProvider && requestId) {
      useProviderStore.getState().removeIncomingRequest(requestId);
    }

    Alert.alert(
      'Emergency Resolved',
      'The emergency has been marked as completed.',
      [
        {
          text: 'OK',
          onPress: async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            router.replace(isProvider ? '/(provider)/dashboard' : '/(tabs)');
          },
        },
      ]
    );

    onEmergencyCompleted();
  }, [isProvider, requestId, router, onEmergencyCompleted]);

  // Handle request cancellation
  const handleRequestCancelled = useCallback(
    (data: any) => {
      console.log('Request cancelled:', data);

      if (isProvider && data.requestId) {
        useProviderStore.getState().removeIncomingRequest(data.requestId);
      }

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
    },
    [isProvider, requestId, router]
  );

  // Handle provider confirmation
  const handleProviderConfirmed = useCallback(
    (data: any) => {
      if (isProvider) return;
      Alert.alert(
        'Confirm Arrival',
        data.message || 'The provider has confirmed his arrival',
        [
          {
            text: 'YES',
            onPress: () =>
              router.replace(isProvider ? '/(provider)/dashboard' : '/(tabs)'),
          },
        ]
      );
    },
    [isProvider, router]
  );

  // Setup socket listeners
  const setupSocketListeners = useCallback(() => {
    socketManager.emit(SocketEvents.USER_JOIN_ROOM, {
      requestId,
      userId: socket?.id,
    });

    socketManager.on(
      SocketEvents.PROVIDER_LOCATION_UPDATED,
      handleProviderLocation
    );
    socketManager.on(SocketEvents.USER_LOCATION_UPDATED, handleUserLocation);
    socketManager.on(SocketEvents.REQUEST_ACCEPTED, handleProviderAccepted);
    socketManager.on(SocketEvents.REQUEST_COMPLETED, handleEmergencyCompleted);
    socketManager.on(SocketEvents.REQUEST_CANCELLED, handleRequestCancelled);
    socketManager.on(
      SocketEvents.REQUEST_CANCELLED_NOTIFICATION,
      handleRequestCancelled
    );
    socketManager.on(
      SocketEvents.PROVIDER_CONFIRM_ARRIVAL,
      handleProviderConfirmed
    );

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
      socketManager.off(
        SocketEvents.REQUEST_CANCELLED_NOTIFICATION,
        handleRequestCancelled
      );
      socketManager.off(
        SocketEvents.PROVIDER_CONFIRM_ARRIVAL,
        handleProviderConfirmed
      );
    };
  }, [
    requestId,
    socket?.id,
    handleProviderLocation,
    handleUserLocation,
    handleProviderAccepted,
    handleEmergencyCompleted,
    handleRequestCancelled,
    handleProviderConfirmed,
  ]);

  return { setupSocketListeners };
};
