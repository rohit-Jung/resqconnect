import type { Sector, SectorConfig } from './sectors';

// Extended config for a tenant (org) fetched from the control plane.
// Keeps the same shape as SectorConfig for backward compat, plus tenantId.
export type TenantConfig = SectorConfig & {
  tenantId: string;
};
