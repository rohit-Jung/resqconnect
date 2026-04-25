import z from 'zod';

import {
  type Sector,
  type SectorConfig,
  baseSectorConfig,
  sectorOverrides,
} from './sectors';

const sectorEnvSchema = z.object({
  SECTOR: z.enum(['fire', 'hospital', 'police']).default('fire'),
});

let cached: SectorConfig | null = null;

export function loadSectorConfig(
  env: NodeJS.ProcessEnv = process.env
): SectorConfig {
  const parsed = sectorEnvSchema.safeParse(env);
  if (!parsed.success) {
    // small error (no huge zod format output).
    throw new Error('Invalid SECTOR environment variable');
  }

  const sector = parsed.data.SECTOR as Sector;
  const overrides = sectorOverrides[sector];

  return {
    sector,
    compliance: {
      ...baseSectorConfig.compliance,
      ...overrides.compliance,
    },
  };
}

export function getSectorConfig(): SectorConfig {
  if (!cached) cached = loadSectorConfig();
  return cached;
}

export type { Sector, SectorConfig };
