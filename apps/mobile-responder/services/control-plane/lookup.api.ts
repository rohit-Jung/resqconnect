import type { ApiResponse } from '@repo/types/api/responses';
import { useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';

import controlPlaneApi from '../controlPlaneAxiosInstance';

interface OrgLookupResponse {
  id: string;
  name: string;
  serviceCategory: string;
}

export const useLookupOrganization = (
  orgId: string,
  enabled: boolean = true
) => {
  return useQuery<AxiosResponse<ApiResponse<OrgLookupResponse>>, AxiosError>({
    queryKey: ['orgLookup', orgId],
    queryFn: () => controlPlaneApi.get(`/orgs/${orgId}`),
    enabled: !!orgId && enabled,
  });
};
