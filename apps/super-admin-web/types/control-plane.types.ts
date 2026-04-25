export type CpAdmin = {
  id: string;
  email: string;
};

export type CpLoginResponse = {
  ok: true;
  token: string;
  admin: CpAdmin;
};

export type CpMeResponse = {
  ok: true;
  admin: CpAdmin;
};

export type CpOrgsListResponse = {
  ok: true;
  orgs: Array<{
    id: string;
    name: string;
    sector: 'hospital' | 'police' | 'fire';
    status: 'pending_approval' | 'active' | 'suspended' | 'trial_expired';
    siloBaseUrl: string;
    siloOrgId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
};

export type CpOrgGetResponse = {
  ok: true;
  org: {
    id: string;
    name: string;
    sector: 'hospital' | 'police' | 'fire';
    status: 'pending_approval' | 'active' | 'suspended' | 'trial_expired';
    siloBaseUrl: string;
    siloOrgId: string | null;
    createdAt: string;
    updatedAt: string;
  };
  replica?: {
    snapshot: unknown;
    capturedAt: string;
  } | null;
  siloMetricsLatest?: {
    sector: string;
    metrics: unknown;
    collectedAt: string;
  } | null;
  silo?: {
    org: unknown | null;
    metrics: unknown | null;
    sector: string | null;
  };
};

export type CpOrgEntitlementsSnapshot = {
  version: number;
  entitlements: Record<string, string | number | boolean | null>;
  createdAt: string;
};

export type CpOrgEntitlementsGetResponse =
  | {
      ok: true;
      snapshot: CpOrgEntitlementsSnapshot;
    }
  | {
      ok: false;
      error: string;
    };

export type CpOrgEntitlementsSetResponse =
  | {
      ok: true;
      snapshot: Pick<CpOrgEntitlementsSnapshot, 'version' | 'createdAt'>;
      version: number;
    }
  | {
      ok: false;
      error: string;
      silo?: { status: number; body: string };
      snapshot?: Pick<CpOrgEntitlementsSnapshot, 'version' | 'createdAt'>;
    };

export type CpPlansListResponse = {
  ok: true;
  plans: Array<{
    id: string;
    name: string;
    price: number;
    durationMonths: number;
    features: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};
