export const socketEvents = {
  // Connection
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',

  // Provider decisions
  PROVIDER_DECISION: 'provider:decision',
  ACCEPT_REQUEST: 'accept-request',
  PROVIDER_CONNECT: 'provider-connect',

  // Emergency events
  NEW_EMERGENCY: 'emergency:new',
  EMERGENCY_ASSIGNED: 'emergency:assigned',
  EMERGENCY_PROVIDERS: 'emergency-providers',
  EMERGENCY_FAILED: 'emergency-failed',

  // Request status events
  REQUEST_ACCEPTED: 'request-accepted',
  REQUEST_TAKEN: 'request-taken',
  REQUEST_ALREADY_TAKEN: 'request-already-taken',
  ACCEPT_CONFIRMED: 'accept-confirmed',
  ACCEPT_FAILED: 'accept-failed',

  // Provider connection events
  CONNECTION_CONFIRMED: 'connection-confirmed',
  CONNECTION_REJECTED: 'connection-rejected',
  CONNECTION_FAILED: 'connection-failed',
  CONNECTION_ESTABLISHED: 'connection-established',
  PROVIDER_DISCONNECTED: 'provider-disconnected',

  // Room events
  JOIN_ROOM: 'join:room',
  USER_JOIN_ROOM: 'user-join-room',
  JOINED_EMERGENCY_ROOM: 'emergency:room_joined',
  JOIN_REJECTED: 'join-rejected',
  EMERGENCY_ROOM: (id: string) => `emergency_room:${id}`,

  // Location events
  LOCATION_UPDATE: 'location-update',
  PROVIDER_LOCATION: 'provider-location',

  // Search escalation
  SEARCH_EXPANDED: 'search-expanded',

  // Notification events
  NOTIFICATION_RECEIVED: 'notification:received',
  NOTIFICATION_READ: 'notification:read',

  // Request completion events
  REQUEST_COMPLETE: 'request-complete',
  REQUEST_CANCEL: 'request-cancel',
  REQUEST_COMPLETED: 'request-completed',
  REQUEST_CANCELLED: 'request-cancelled',
};
