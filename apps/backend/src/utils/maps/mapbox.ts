import {
  DIRECTIONS_URL,
  GeometryFormat,
  MATRIX_URL,
  OverviewType,
  VoiceUnit,
} from '@/constants/mapbox.constants';
import {
  type ConstructDirectionUrlProps,
  type ConstructMatrixUrlProps,
  constructDirectionUrlPropsSchema,
} from '@/validations/maps.validations';

// ref: https://docs.mapbox.com/api/navigation/directions
export function constructDirectionUrl(
  props: ConstructDirectionUrlProps
): string {
  const validated = constructDirectionUrlPropsSchema.parse(props);

  const {
    profile,
    token,
    origin,
    dest,
    showAlt = true,
    lang = 'en',
    geometries = GeometryFormat.GeoJSON,
    overview = OverviewType.Full,
    steps = true,
    bannerInstructions = false,
    voiceInstructions = false,
    voiceUnits = VoiceUnit.Metric,
    continueStraight,
    waypointNames,
    approaches,
    exclude,
  } = validated;

  const coordinates = `${origin.lng},${origin.lat};${dest.lng},${dest.lat}`;
  const directionURL = new URL(`${DIRECTIONS_URL}/${profile}/${coordinates}`);

  // params
  directionURL.searchParams.append('access_token', token);
  directionURL.searchParams.append('alternatives', showAlt.toString());
  directionURL.searchParams.append('geometries', geometries);
  directionURL.searchParams.append('language', lang);
  directionURL.searchParams.append('overview', overview);
  directionURL.searchParams.append('steps', steps.toString());

  //  optionals
  if (bannerInstructions) {
    directionURL.searchParams.append(
      'banner_instructions',
      bannerInstructions.toString()
    );
  }

  if (voiceInstructions) {
    directionURL.searchParams.append(
      'voice_instructions',
      voiceInstructions.toString()
    );
    directionURL.searchParams.append('voice_units', voiceUnits);
  }

  if (continueStraight !== undefined) {
    directionURL.searchParams.append(
      'continue_straight',
      continueStraight.toString()
    );
  }

  if (waypointNames) {
    directionURL.searchParams.append('waypoint_names', waypointNames);
  }

  if (approaches) {
    directionURL.searchParams.append('approaches', approaches);
  }

  if (exclude) {
    directionURL.searchParams.append('exclude', exclude);
  }

  return directionURL.toString();
}

// For batch ETA calculations
export function constructMatrixUrl(props: ConstructMatrixUrlProps): string {
  const { profile, token, coordinates, sources, destinations } = props;

  // Format: "lng,lat;lng,lat;lng,lat"
  const coordsString = coordinates.map(c => `${c.lng},${c.lat}`).join(';');

  const matrixURL = new URL(`${MATRIX_URL}/${profile}/${coordsString}`);

  matrixURL.searchParams.append('access_token', token);
  matrixURL.searchParams.append('annotations', 'duration,distance');

  if (sources) {
    matrixURL.searchParams.append('sources', sources.join(';'));
  }
  if (destinations) {
    matrixURL.searchParams.append('destinations', destinations.join(';'));
  }

  return matrixURL.toString();
}
