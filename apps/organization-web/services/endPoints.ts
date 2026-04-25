export const userEndpoints = {
  login: `/user/login`,
  register: `/user/register`,
  verify: `/user/verify`,
  forgotPassword: `/user/forgot-password`,
  resetPassword: `/user/reset-password`,
  changePassword: `/user/change-password`,
};

export const orgEndpoints = {
  login: `/organization/login`,
  register: `/organization/register`,
  verify: `/organization/verify`,
  resendOtp: `/organization/resend-otp`,
  profile: `/organization/profile`,
  updateProfile: `/organization/profile`,
  list: `/organization/list`,
  // Dashboard analytics
  dashboardAnalytics: `/organization/dashboard-analytics`,
  // Service Provider management by organization
  serviceProviders: `/organization/service-providers`,
  getProvider: (id: string) => `/organization/service-providers/${id}`,
  updateProvider: (id: string) => `/organization/service-providers/${id}`,
  deleteProvider: (id: string) => `/organization/service-providers/${id}`,
  verifyProvider: (id: string) =>
    `/organization/service-providers/${id}/verify`,
  // Document verification
  pendingVerifications: `/organization/verifications/pending`,
  getProviderDocuments: (providerId: string) =>
    `/organization/verifications/${providerId}`,
  verifyDocuments: (providerId: string) =>
    `/organization/verifications/${providerId}/verify`,
};

export const paymentEndpoints = {
  // Control-plane billing endpoints
  plans: `/plans`,
  subscribe: `/billing/my/checkout`,
  status: (paymentId: string) => `/billing/my/payments/${paymentId}`,
  byPidx: (pidx: string) => `/billing/my/payments/by-pidx/${pidx}`,
  verify: `/billing/my/payments/verify`,
  history: `/billing/my/payments`,
  subscription: `/billing/my/subscription`,
};

export const superAdminEndpoints = {
  login: `/super-admin/login`,
  profile: `/super-admin/profile`,
  // Organization management
  organizations: `/super-admin/organizations`,
  getOrganization: (id: string) => `/super-admin/organizations/${id}`,
  updateOrganization: (id: string) => `/super-admin/organizations/${id}`,
  deleteOrganization: (id: string) => `/super-admin/organizations/${id}`,
  verifyOrganization: (id: string) => `/super-admin/organizations/${id}/verify`,
  // User management
  users: `/super-admin/users`,
  getUser: (id: string) => `/super-admin/users/${id}`,
  // Service Provider management
  serviceProviders: `/super-admin/service-providers`,
  getServiceProvider: (id: string) => `/super-admin/service-providers/${id}`,
  // Analytics
  analytics: `/super-admin/analytics`,
  emergencyReports: `/super-admin/emergency-reports`,
};
