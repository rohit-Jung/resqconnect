export const TOKEN_KEY = 'token_key';
export const USER_KEY = 'user_key';

export const BASE_URL =
  process.env.NODE_ENV === 'development'
    ? process.env.EXPO_PUBLIC_BACKEND_PROD
    : process.env.EXPO_PUBLIC_BACKEND_DEV;

export const AVAILABLE_SERVICES = [
  'ambulance',
  'police',
  'rescue_team',
  'fire_truck',
];

// Emergency contact numbers
export const EMERGENCY_PHONE_NUMBER = '112'; // Universal emergency number (change based on region)
export const SMS_FALLBACK_NUMBER = '+919999999999'; // Backend SMS gateway number for offline fallback

// App info
export const APP_VERSION = '1.0.0';
export const APP_NAME = 'ResQ Connect';

export enum SocketEventEnums {
  CONNECTION_EVENT = 'connection',
  DISCONNECT_EVENT = 'disconnect',

  AUTHORIZED_EVENT = 'authorized',

  JOIN_EMERGENCY_ROOM = 'joinEmergencyRoom',
  LEAVE_EMERGENCY_ROOM = 'leaveEmergencyRoom',
  EMERGENCY_RESPONSE_CREATED = 'emergencyResponseCreated',
  NOTIFICATION_CREATED = 'notificationCreated',
  EMERGENCY_RESPONSE_STATUS_UPDATED = 'emergencyResponseStatusUpdated',

  UPDATE_LOCATION = 'updateLocation',
  UPDATE_USER_LOCATION = 'updateUserLocation',
  SEND_LOCATION = 'sendLocation',
  SEND_USER_LOCATION = 'sendUserLocation',

  PROVIDER_FOUND = 'providerFound',

  PROVIDER_STATUS_UPDATED = 'providerStatusUpdated',
  REQUEST_EMERGENCY_SERVICE = 'requestEmergencyService',
  UPDATE_PROVIDER_STATUS = 'updateProviderStatus',
  UPDATE_PROVIDER_LOCATION = 'updateProviderLocation',

  NEED_LOCATION = 'needLocation',

  SOCKET_ERROR = 'socketError',
}
