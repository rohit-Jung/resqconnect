export const COLORS = {
  SIGNAL_RED: '#E63329',
  PRIMARY: '#E63946',
  OFF_WHITE: '#F5F4F0',
  MID_GRAY: '#888888',
  LIGHT_GRAY: '#E8E6E1',
  BLACK: '#000000',
  BLUE: '#3B82F6',
  GREEN: '#10B981',
  ORANGE: '#F97316',
  AMBER: '#F59E0B',
  RED: '#EF4444',
} as const;

export const EMERGENCY_ICONS = {
  ambulance: { icon: 'ambulance', color: COLORS.SIGNAL_RED, label: 'Medical' },
  police: { icon: 'shield-account', color: COLORS.BLUE, label: 'Police' },
  fire_truck: { icon: 'fire-truck', color: COLORS.ORANGE, label: 'Fire' },
  rescue_team: { icon: 'lifebuoy', color: COLORS.GREEN, label: 'Rescue' },
} as const;

export const STATUS_MESSAGES = {
  pending: { message: 'FINDING NEARBY RESPONDERS...', color: COLORS.AMBER },
  acceptedUser: { message: 'RESPONDER IS ON THE WAY', color: COLORS.GREEN },
  acceptedProvider: { message: 'YOU ARE ON THE WAY', color: COLORS.GREEN },
  in_progress: { message: 'HELP IS ARRIVING', color: COLORS.BLUE },
  completed: { message: 'EMERGENCY RESOLVED', color: COLORS.GREEN },
  cancelled: { message: 'REQUEST CANCELLED', color: COLORS.MID_GRAY },
  no_providers_available: {
    message: 'NO RESPONDERS AVAILABLE NEARBY',
    color: COLORS.SIGNAL_RED,
  },
} as const;

export const LOCATION_TRACKING = {
  ROUTE_REFETCH_THRESHOLD: 50,
  LOCATION_BROADCAST_INTERVAL: 3000,
  LOCATION_UPDATE_INTERVAL: 3000,
  LOCATION_DISTANCE_INTERVAL: 5,
  SIMULATION_INTERVAL: 1000,
  SIMULATION_INCREMENT: 0.01,
  GPS_ACCURACY: 'High',
  SOCKET_TIMEOUT: 5000,
} as const;

export const MAP_CONFIG = {
  INITIAL_DELTA: {
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  },
  FIT_TO_COORDINATES_PADDING: {
    top: 100,
    right: 50,
    bottom: 250,
    left: 50,
  },
  RECENTER_DELTA: {
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
} as const;

export const ANIMATION_CONFIG = {
  PULSE_SCALE_UP: 1.2,
  PULSE_SCALE_DOWN: 1,
  PULSE_DURATION: 1000,
  USE_NATIVE_DRIVER: true,
} as const;

export const MARKER_SIZES = {
  USER_MARKER: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  PROVIDER_MARKER: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  ASSIGNED_PROVIDER_MARKER: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
} as const;

export const UI_CONFIG = {
  HEADER_PADDING_TOP_IOS: 60,
  HEADER_PADDING_TOP_ANDROID: 40,
  SHADOW_OPACITY: 0.25,
  SHADOW_OFFSET: { width: 0, height: 2 },
  SHADOW_RADIUS: 4,
  ELEVATION: 5,
  BORDER_RADIUS_SMALL: 12,
  BORDER_RADIUS_LARGE: 20,
  BORDER_RADIUS_XLARGE: 24,
} as const;
