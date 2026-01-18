export const socketEvents = {
  CONNECTION: 'connection',
  PROVIDER_DECISION: 'provider:decision',
  NEW_EMERGENCY: 'emergency:new',

  EMERGENCY_ASSIGNED: 'emergency:assigned',
  JOIN_ROOM: 'join:room',
  JOINED_EMERGENCY_ROOM: 'emergency:room_joined',
  EMERGENCY_ROOM: (id: string) => `emergency_room:${id}`,
};
