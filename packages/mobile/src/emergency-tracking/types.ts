export type LocationCoords = {
  latitude: number;
  longitude: number;
};

export type EmergencyTrackingRole = 'user' | 'provider';

export type EmergencyStatusMessage = {
  message: string;
  color: string;
};

export type EmergencyTypeKey =
  | 'ambulance'
  | 'police'
  | 'fire_truck'
  | 'rescue_team';

export type EmergencyIconInfo = {
  icon: string;
  color: string;
  label: string;
};

export type RouteInfo = {
  distance: number;
  duration: number;
};
