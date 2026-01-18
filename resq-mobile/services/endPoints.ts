export const userEndpoints = {
  login: `/user/login`,
  register: `/user/register`,
  verify: `/user/verify`,
  forgotPassword: `/user/forgot-password`,
  resetPassword: `/user/reset-password`,
  changePassword: `/user/change-password`,
  profile: `/user/profile`,
  updateProfile: `/user/update`,
  emergencySettings: `/user/settings/emergency`,
  updatePushToken: `/user/update-push-token`,
};

export const serviceProviderEndpoints = {
  login: `/service-provider/login`,
  forgotPassword: `/service-provider/forgot-password`,
  resetPassword: `/service-provider/reset-password`,
  changePassword: `/service-provider/change-password`,
  profile: `/service-provider/profile`,
  updateProfile: `/service-provider/update`,
  updateStatus: `/service-provider/status`,
};

export const emergencyRequestEndpoints = {
  create: `/emergency-request`,
  getAll: `/emergency-request`,
  getById: (id: string) => `/emergency-request/${id}`,
  cancel: (id: string) => `/emergency-request/${id}/cancel`,
};

export const emergencyContactEndpoints = {
  create: `/emergency-contacts`,
  getAll: `/emergency-contacts`,
  getById: (id: string) => `/emergency-contacts/${id}`,
  update: (id: string) => `/emergency-contacts/${id}`,
  delete: (id: string) => `/emergency-contacts/${id}`,
  toggleNotification: (id: string) => `/emergency-contacts/${id}/toggle-notification`,
  updatePushToken: (id: string) => `/emergency-contacts/${id}/push-token`,
  getCommon: `/emergency-contacts/common/all`,
};
