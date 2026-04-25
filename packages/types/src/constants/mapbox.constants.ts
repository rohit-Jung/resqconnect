export const RoutingProfiles = [
  'driving-traffic',
  'driving',
  'walking',
  'cycling',
] as const;

export const GeometryFormat = ['geojson', 'polyline', 'polyline6'] as const;

export const OverviewType = ['full', 'simplified', 'false'] as const;

export const VoiceUnit = ['imperial', 'metric'] as const;

export type RoutingProfile = (typeof RoutingProfiles)[number];
export type GeometryFormatType = (typeof GeometryFormat)[number];
export type OverviewTypeType = (typeof OverviewType)[number];
export type VoiceUnitType = (typeof VoiceUnit)[number];
