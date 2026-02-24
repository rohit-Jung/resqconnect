export enum KAFKA_TOPICS {
  EMERGENCY_CREATED = 'emergency_created',
  EMERGENCY_ACCEPTED = 'emergency_accepted',
  EMERGENCY_CANCELLED = 'emergency_cancelled',
  EMERGENCY_COMPLETED = 'emergency_completed',
  PROVIDER_LOCATION_UPDATE = 'provider_location_update',

  // refactoring
  MEDICAL_EVENTS = 'medical_events',
  POLICE_EVENTS = 'police_events',
  RESCUE_EVENTS = 'rescue_events',
  FIRE_EVENTS = 'fire_events',
}

export enum EVENT_TYPES {
  REQUEST_CREATED = 'request_created',
  RESPONSE_CREATED = 'response_created',

  PROVIDER_ASSIGNED = 'provider_assigned',
}

export enum KAFKA_CONSUMER_ID {
  NOTIFICATION = 'notification_updates_group',
  ASSIGN_RESPONDER = 'assign_responder_group',
}

export const OUTBOX_EVENT_TYPES = {
  CREATED: 'created',
  ACCEPTED: 'accepted',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export const AGGREGATE_TYPES = {
  EMERGENCY_REQUEST: 'emergency-request',
} as const;
