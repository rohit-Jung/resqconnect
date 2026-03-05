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
  profile: `/organization/profile`,
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
