import { sql } from 'drizzle-orm';
import { gridDisk, latLngToCell } from 'h3-js';

import type { ServiceTypeEnum } from '@/constants';
import db from '@/db';
import { serviceProvider } from '@/models';

interface IProviderInfo {
  lat: number;
  lng: number;
  type: ServiceTypeEnum;
}

export async function findNearbyProviders({
  lat,
  lng,
  type,
}: IProviderInfo): Promise<
  Array<{
    id: string;
    distance: unknown;
  }>
> {
  // res - how large or small hex cells are
  const h3Idx = latLngToCell(lat, lng, 8);

  // ringSize - k rings if 2 then center and its ring ?
  const nearbyCells = gridDisk(h3Idx, 2);

  const providers = await db
    .select({
      id: serviceProvider.id,
      distance: sql`ST_Distance(
        ${serviceProvider.lastLocation}, 
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      )`,
    })
    .from(serviceProvider)
    // FAST FILTER: Only look in these specific H3 cells
    .where(
      sql`${serviceProvider.h3Index} IN ${nearbyCells} AND ${serviceProvider.serviceStatus} = 'available' AND ${serviceProvider.serviceType} = ${type}`,
    )
    // ACCURATE SORT: Use PostGIS for real distance
    .orderBy(
      sql`${serviceProvider.lastLocation} <-> ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`,
    )
    .limit(1);

  return providers;
}
