import z from 'zod';
import { type z as zType } from 'zod';

import {
  GeometryFormat,
  OverviewType,
  RoutingProfiles,
  VoiceUnit,
} from '../constants/mapbox.constants';

const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const getRouteDataSchema = z.object({
  profile: z.enum(RoutingProfiles).default(RoutingProfiles[1]),
  origin: coordinatesSchema,
  dest: coordinatesSchema,
  showAlt: z.boolean().optional(),
  lang: z.string().optional(),
  geometries: z.enum(GeometryFormat).optional(),
  overview: z.enum(OverviewType).optional(),
  steps: z.boolean().optional(),
  bannerInstructions: z.boolean().optional(),
  voiceInstructions: z.boolean().optional(),
  voiceUnits: z.enum(VoiceUnit).optional(),
  continueStraight: z.boolean().optional(),
  waypointNames: z.string().optional(),
  approaches: z.string().optional(),
  exclude: z.string().optional(),
});

export const constructDirectionUrlPropsSchema = getRouteDataSchema.extend({
  token: z.string(),
});

export const consturctMatrilUrlPropsSchema = z.object({
  profile: z.enum(RoutingProfiles),
  token: z.string(),
  coordinates: z.array(coordinatesSchema), // Array of all locations
  sources: z.array(z.number()), // Indices of origin points
  destinations: z.array(z.number()), // Indices of destination points
});

export type ConstructMatrixUrlProps = zType.infer<
  typeof consturctMatrilUrlPropsSchema
>;
export type Coordinates = zType.infer<typeof coordinatesSchema>;
export type ConstructDirectionUrlProps = zType.infer<
  typeof constructDirectionUrlPropsSchema
>;
