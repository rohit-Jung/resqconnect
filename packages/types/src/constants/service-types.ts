export const serviceTypes = [
  'ambulance',
  'police',
  'rescue_team',
  'fire_truck',
] as const;

export type ServiceType = (typeof serviceTypes)[number];
