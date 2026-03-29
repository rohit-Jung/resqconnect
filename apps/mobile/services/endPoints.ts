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
  updateLocation: `/user/update-location`,
};

export const uploadEndpoints = {
  getSignature: `/upload/signature`,
  updateProfilePicture: `/upload/profile-picture`,
  deleteProfilePicture: `/upload/profile-picture`,
};

export const serviceProviderEndpoints = {
  login: `/service-provider/login`,
  verify: `/service-provider/verify`,
  forgotPassword: `/service-provider/forgot-password`,
  resetPassword: `/service-provider/reset-password`,
  changePassword: `/service-provider/change-password`,
  profile: `/service-provider/profile`,
  updateProfile: `/service-provider/update`,
  updateStatus: `/service-provider/status`,
  updateLocation: `/service-provider/update-location`,
  nearby: `/service-provider/nearby`,
  // Document verification
  uploadDocuments: `/service-provider/documents`,
  documentStatus: `/service-provider/documents/status`,
};

export const emergencyRequestEndpoints = {
  create: `/emergency-request`,
  getAll: `/emergency-request`,
  getById: (id: string) => `/emergency-request/${id}`,
  cancel: (id: string) => `/emergency-request/${id}/cancel`,
  status: (id: string) => `/emergency-request/${id}/status`,
  confirmArrival: (id: string) => `/emergency-request/${id}/confirm-arrival`,
  complete: (id: string) => `/emergency-request/${id}/complete`,
  // History endpoints
  userHistory: `/emergency-request/user/history`,
  providerHistory: `/emergency-request/provider/history`,
};

export const emergencyContactEndpoints = {
  create: `/emergency-contacts`,
  getAll: `/emergency-contacts`,
  getById: (id: string) => `/emergency-contacts/${id}`,
  update: (id: string) => `/emergency-contacts/${id}`,
  delete: (id: string) => `/emergency-contacts/${id}`,
  toggleNotification: (id: string) =>
    `/emergency-contacts/${id}/toggle-notification`,
  updatePushToken: (id: string) => `/emergency-contacts/${id}/push-token`,
  getCommon: `/emergency-contacts/common/all`,
};

export const mapsEndpoints = {
  getRoute: `/maps/optimal-route`,
  getAutocomplete: `/maps/autocomplete`,
};
