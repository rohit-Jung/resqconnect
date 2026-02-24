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
