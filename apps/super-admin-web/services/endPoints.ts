// API Endpoints that map to the existing backend routes
// Super admin uses the user/admin role for authentication

export const authEndpoints = {
  login: `/user/login`,
  logout: `/user/logout`,
  profile: `/user/profile`,
  verify: `/user/verify`,
};

export const organizationEndpoints = {
  getAll: `/organization`,
  getById: (id: string) => `/organization/${id}`,
  update: (id: string) => `/organization/${id}`,
  delete: (id: string) => `/organization/${id}`,
  register: `/organization/register`,
};

export const userEndpoints = {
  getById: (id: string) => `/user/${id}`,
};

export const serviceProviderEndpoints = {
  getNearby: `/service-provider/nearby`,
  getById: (id: string) => `/service-provider/${id}`,
};

export const adminEndpoints = {
  dashboardAnalytics: `/admin/dashboard-analytics`,
};

export const emergencyEndpoints = {
  requests: `/emergency-request`,
  getRequest: (id: string) => `/emergency-request/${id}`,
  responses: `/emergency-response`,
  getResponse: (id: string) => `/emergency-response/${id}`,
};

export const paymentEndpoints = {
  plans: `/payments/plans`,
  planById: (id: string) => `/payments/plans/${id}`,
  getAllPayments: `/payments/history`,
  getPaymentById: (id: string) => `/payments/status/${id}`,
  subscribe: `/payments/subscribe`,
  subscription: `/payments/subscription`,
};
