export type CpAdmin = {
  id: string;
  email: string;
};

export type CpLoginResponse = {
  statusCode: number;
  message: string;
  data: {
    token: string;
    admin: CpAdmin;
  };
  success: boolean;
};

export type CpMeResponse = {
  statusCode: number;
  message: string;
  data: {
    admin: CpAdmin;
  };
  success: boolean;
};

type CpOrgShape = {
  id: string;
  name: string;
  sector: 'hospital' | 'police' | 'fire';
  status: 'pending_approval' | 'active' | 'suspended' | 'trial_expired';
  siloBaseUrl: string;
  siloOrgId: string | null;
  planId: string | null;
  databaseUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CpOrgsListResponse = {
  statusCode: number;
  message: string;
  data: {
    orgs: CpOrgShape[];
  };
  success: boolean;
};

export type CpOrgGetResponse = {
  ok: true;
  org: CpOrgShape;
  replica: {
    snapshot: unknown;
    capturedAt: string;
  } | null;
  siloMetricsLatest: {
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

export type CpOrgEntitlementsGetResponse = {
  statusCode: number;
  message: string;
  data: {
    snapshot: CpOrgEntitlementsSnapshot;
  };
  success: boolean;
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

export type CpUser = {
  id: string;
  name: string;
  email: string;
  phoneNumber: number;
  primaryAddress: string;
  isVerified: boolean | null;
  role: string | null;
  createdAt: string;
};

export type CpUsersListResponse = {
  statusCode: number;
  message: string;
  data: {
    total: number;
    page: number;
    limit: number;
    users: CpUser[];
  };
  success: boolean;
};

export type CpPaymentsListResponse = {
  ok: true;
  payments: Array<{
    id: string;
    organizationId: string;
    organization?: { name: string };
    amount: number;
    status: string;
    createdAt: string;
    subscription?: { plan?: { name: string } };
  }>;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

export type CpPlansListResponse = {
  statusCode: number;
  message: string;
  data: {
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
  success: boolean;
};
