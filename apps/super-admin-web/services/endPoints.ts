// API Endpoints that map to the existing backend routes
// Super admin uses the user/admin role for authentication

export const authEndpoints = {
  login: `/auth/login`,
  me: `/auth/me`,
};

export const organizationEndpoints = {
  getAll: `/orgs`,
  getById: (id: string) => `/orgs/${id}`,
  deleteById: (id: string) => `/orgs/${id}`,
  provision: `/orgs/provision`,
  updateStatus: (id: string) => `/orgs/${id}/status`,
  entitlements: (id: string) => `/orgs/${id}/entitlements`,
};

export const userEndpoints = {
  // todo: control plane doesn't implement per-user detail endpoint yet
  getById: (_id: string) => {
    void _id;
    return '';
  },
};

export const serviceProviderEndpoints = {
  // TODO: control plane doesn't implement per-provider endpoints yet
  getNearby: '',
  getById: (_id: string) => {
    void _id;
    return '';
  },
};

export const adminEndpoints = {
  dashboard: `/admin/dashboard-analytics`,
};

export const emergencyEndpoints = {};

export const paymentEndpoints = {
  plans: `/plans`,
  checkout: `/billing/checkout`,
  planById: (id: string) => `/plans/${id}`,
  payments: `/billing/payments`,
  paymentById: (id: string) => `/billing/payments/${id}`,
};
