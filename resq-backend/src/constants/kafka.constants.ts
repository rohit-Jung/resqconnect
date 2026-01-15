export enum KAFKA_TOPICS {
  EMERGENCY_CREATED = 'emergency_created',
  EMERGENCY_ACCEPTED = 'emergency_accepted',
  EMERGENCY_CANCELLED = 'emergency_cancelled',
  EMERGENCY_COMPLETED = 'emergency_completed',
  PROVIDER_LOCATION_UPDATE = 'provider_location_update',
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
