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
	// Service Provider management by organization
	serviceProviders: `/organization/service-providers`,
	getProvider: (id: string) => `/organization/service-providers/${id}`,
	updateProvider: (id: string) => `/organization/service-providers/${id}`,
	deleteProvider: (id: string) => `/organization/service-providers/${id}`,
	verifyProvider: (id: string) => `/organization/service-providers/${id}/verify`,
};
