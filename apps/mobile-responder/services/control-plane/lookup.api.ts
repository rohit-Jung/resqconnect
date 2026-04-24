import { useQuery } from '@tanstack/react-query';

import { controlPlaneApi } from '@/services/controlPlaneAxiosInstance';

export type Sector = 'hospital' | 'police' | 'fire';

export type LookupOrg = {
  id: string;
  name: string;
  sector: Sector;
  status: 'pending_approval' | 'active' | 'suspended' | 'trial_expired';
  siloBaseUrl: string;
};

export function useLookupOrgs(params: { sector?: Sector; status?: string }) {
  const sector = params.sector;
  const status = params.status;
  const clientHost =
    typeof process.env.EXPO_PUBLIC_CLIENT_HOST === 'string'
      ? process.env.EXPO_PUBLIC_CLIENT_HOST
      : undefined;

  return useQuery({
    queryKey: ['cp', 'lookup', 'orgs', sector || '', status || ''],
    enabled: !!sector,
    queryFn: async () => {
      const res = await controlPlaneApi.get('/lookup/orgs', {
        params: {
          sector,
          status,
          clientHost,
        },
      });
      return (res.data?.orgs ?? []) as LookupOrg[];
    },
  });
}
