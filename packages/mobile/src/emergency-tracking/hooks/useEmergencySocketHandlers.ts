import { useCallback } from 'react';
import { Alert } from 'react-native';

import type { ISocketManager } from '../../socket/socket-manager';

export type { ISocketManager };

export type SocketEventsMap = {
  USER_JOIN_ROOM: string;
  PROVIDER_LOCATION_UPDATED: string;
  USER_LOCATION_UPDATED: string;
  REQUEST_ACCEPTED: string;
  REQUEST_COMPLETED: string;
  REQUEST_CANCELLED: string;
  REQUEST_CANCELLED_NOTIFICATION: string;
  PROVIDER_CONFIRM_ARRIVAL: string;
  CANCEL_REQUEST?: string;
};

export type MapboxToLatLngFn = (coords: any[]) => any[];

type LocationCoords = { latitude: number; longitude: number };

type RouteInfo = { distance: number; duration: number };

export type UseEmergencySocketHandlersParams<TAssignedProvider> = {
  requestId: string;
  isProvider: boolean;
  socketId?: string;
  socketManager: ISocketManager;
  socketEvents: SocketEventsMap;
  mapboxToLatLng: MapboxToLatLngFn;
  onProviderLocationUpdate: (location: LocationCoords) => void;
  onUserLocationUpdate: (location: LocationCoords) => void;
  onProviderAccepted: (provider: TAssignedProvider, route?: any) => void;
  onEmergencyCompleted: () => void;
  onRouteCoordinatesUpdate: (coords: any[]) => void;
  onRouteInfoUpdate: (info: RouteInfo) => void;
  onRemoveIncomingRequest?: (requestId: string) => void;
  navigateAfterExit: () => void;
  buildAssignedProvider: (data: any) => TAssignedProvider;
};

export function useEmergencySocketHandlers<TAssignedProvider>({
  requestId,
  isProvider,
  socketId,
  socketManager,
  socketEvents,
  mapboxToLatLng,
  onProviderLocationUpdate,
  onUserLocationUpdate,
  onProviderAccepted,
  onEmergencyCompleted,
  onRouteCoordinatesUpdate,
  onRouteInfoUpdate,
  onRemoveIncomingRequest,
  navigateAfterExit,
  buildAssignedProvider,
}: UseEmergencySocketHandlersParams<TAssignedProvider>) {
  const parseLocation = useCallback((location: any): LocationCoords | null => {
    const lat =
      typeof location.latitude === 'string'
        ? parseFloat(location.latitude)
        : location.latitude;
    const lng =
      typeof location.longitude === 'string'
        ? parseFloat(location.longitude)
        : location.longitude;

    if (!isNaN(lat) && !isNaN(lng)) return { latitude: lat, longitude: lng };
    return null;
  }, []);

  const handleProviderLocation = useCallback(
    (data: any) => {
      if (data.location && !isProvider) {
        const location = parseLocation(data.location);
        if (location) onProviderLocationUpdate(location);
      }
    },
    [isProvider, parseLocation, onProviderLocationUpdate]
  );

  const handleUserLocation = useCallback(
    (data: any) => {
      if (data.location && isProvider) {
        const location = parseLocation(data.location);
        if (location) onUserLocationUpdate(location);
      }
    },
    [isProvider, parseLocation, onUserLocationUpdate]
  );

  const handleProviderAccepted = useCallback(
    (data: any) => {
      if (!data.provider) return;

      const assignedProvider = buildAssignedProvider(data);

      if (
        data.provider.location?.latitude &&
        data.provider.location?.longitude
      ) {
        const location = parseLocation(data.provider.location);
        if (location) onProviderLocationUpdate(location);
      }

      if (
        data.route?.coordinates &&
        Array.isArray(data.route.coordinates) &&
        data.route.coordinates.length > 0
      ) {
        const coords = mapboxToLatLng(data.route.coordinates);
        onRouteCoordinatesUpdate(coords);
        onRouteInfoUpdate({
          distance: data.route.distance,
          duration: data.route.duration,
        });
      }

      onProviderAccepted(assignedProvider, data.route);
    },
    [
      buildAssignedProvider,
      mapboxToLatLng,
      parseLocation,
      onProviderLocationUpdate,
      onProviderAccepted,
      onRouteCoordinatesUpdate,
      onRouteInfoUpdate,
    ]
  );

  const handleEmergencyCompletedInternal = useCallback(() => {
    if (isProvider && requestId) onRemoveIncomingRequest?.(requestId);

    Alert.alert(
      'Emergency Resolved',
      'The emergency has been marked as completed.',
      [
        {
          text: 'OK',
          onPress: async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
            navigateAfterExit();
          },
        },
      ]
    );

    onEmergencyCompleted();
  }, [
    isProvider,
    requestId,
    onRemoveIncomingRequest,
    navigateAfterExit,
    onEmergencyCompleted,
  ]);

  const handleRequestCancelled = useCallback(
    (data: any) => {
      if (isProvider && data.requestId)
        onRemoveIncomingRequest?.(data.requestId);

      if (data.requestId === requestId) {
        Alert.alert(
          'Request Cancelled',
          data.message || 'The user has cancelled this emergency request.',
          [{ text: 'OK', onPress: () => navigateAfterExit() }]
        );
      }
    },
    [isProvider, requestId, onRemoveIncomingRequest, navigateAfterExit]
  );

  const handleProviderConfirmed = useCallback(
    (data: any) => {
      if (isProvider) return;
      Alert.alert(
        'Confirm Arrival',
        data.message || 'The provider has confirmed his arrival',
        [{ text: 'YES', onPress: () => navigateAfterExit() }]
      );
    },
    [isProvider, navigateAfterExit]
  );

  const setupSocketListeners = useCallback(() => {
    socketManager.emit(socketEvents.USER_JOIN_ROOM, {
      requestId,
      userId: socketId,
    });

    socketManager.on(
      socketEvents.PROVIDER_LOCATION_UPDATED,
      handleProviderLocation
    );
    socketManager.on(socketEvents.USER_LOCATION_UPDATED, handleUserLocation);
    socketManager.on(socketEvents.REQUEST_ACCEPTED, handleProviderAccepted);
    socketManager.on(
      socketEvents.REQUEST_COMPLETED,
      handleEmergencyCompletedInternal
    );
    socketManager.on(socketEvents.REQUEST_CANCELLED, handleRequestCancelled);
    socketManager.on(
      socketEvents.REQUEST_CANCELLED_NOTIFICATION,
      handleRequestCancelled
    );
    if (socketEvents.CANCEL_REQUEST) {
      socketManager.on(socketEvents.CANCEL_REQUEST, handleRequestCancelled);
    }
    socketManager.on(
      socketEvents.PROVIDER_CONFIRM_ARRIVAL,
      handleProviderConfirmed
    );

    return () => {
      socketManager.off(
        socketEvents.PROVIDER_LOCATION_UPDATED,
        handleProviderLocation
      );
      socketManager.off(socketEvents.USER_LOCATION_UPDATED, handleUserLocation);
      socketManager.off(socketEvents.REQUEST_ACCEPTED, handleProviderAccepted);
      socketManager.off(
        socketEvents.REQUEST_COMPLETED,
        handleEmergencyCompletedInternal
      );
      socketManager.off(socketEvents.REQUEST_CANCELLED, handleRequestCancelled);
      socketManager.off(
        socketEvents.REQUEST_CANCELLED_NOTIFICATION,
        handleRequestCancelled
      );
      if (socketEvents.CANCEL_REQUEST) {
        socketManager.off(socketEvents.CANCEL_REQUEST, handleRequestCancelled);
      }
      socketManager.off(
        socketEvents.PROVIDER_CONFIRM_ARRIVAL,
        handleProviderConfirmed
      );
    };
  }, [
    requestId,
    socketId,
    socketManager,
    socketEvents,
    handleProviderLocation,
    handleUserLocation,
    handleProviderAccepted,
    handleEmergencyCompletedInternal,
    handleRequestCancelled,
    handleProviderConfirmed,
  ]);

  return { setupSocketListeners };
}
