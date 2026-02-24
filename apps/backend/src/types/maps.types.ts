export interface RouteResponse {
  routes: Array<{
    geometry: {
      coordinates: [number, number][];
      type: string;
    };
    legs: Array<{
      distance: number; // in meters
      duration: number; // in seconds
      steps: Array<{
        distance: number;
        duration: number;
        geometry: {
          coordinates: [number, number][];
        };
        maneuver: {
          instruction: string;
          type: string;
          modifier?: string;
          location: [number, number];
        };
        name: string;
      }>;
    }>;
    distance: number;
    duration: number;
  }>;
  waypoints: Array<{
    location: [number, number];
    name: string;
  }>;
}

export interface RouteResult {
  success: boolean;
  route?: {
    coordinates: [number, number][];
    distance: number; // in km
    duration: number; // in minutes
    steps?: Array<{
      instruction: string;
      distance: number;
      duration: number;
    }>;
  };
  error?: string;
}
