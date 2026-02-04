export const BASE_MAPBOX_URL = 'https://api.mapbox.com';
export const DIRECTIONS_URL = `${BASE_MAPBOX_URL}/directions/v5/mapbox`;

export enum RoutingProfiles {
  DrivingTraffic = 'driving-traffic',
  Driving = 'driving',
  Walking = 'walking',
  Cycling = 'cycling'
}

export enum GeometryFormat {
  GeoJSON = 'geojson',
  Polyline = 'polyline',
  Polyline6 = 'polyline6'
}

export enum OverviewType {
  Full = 'full',
  Simplified = 'simplified',
  False = 'false'
}

export enum VoiceUnit {
  Imperial = 'imperial',
  Metric = 'metric'
}



