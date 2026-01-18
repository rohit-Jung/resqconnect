export interface ILoginResponse {
	token: string;
	user: {
		id: string;
		email: string;
		username: string;
		name: string;
	};
	message?: string;
}

export interface IOtpResponse {
	userId: string;
	otpToken: string;
}

export interface IRegisterResponse {
	userId?: string;
	message?: string;
}

export interface IVerifyResponse {
	message?: string;
	verified?: boolean;
	token?: string;
}

export interface IForgotPasswordResponse {
	message?: string;
	userId?: string;
}

export interface IResetPasswordResponse {
	message?: string;
}

export interface IChangePasswordResponse {
	message?: string;
}

// Organization Types
export type ServiceCategory =
	| "ambulance"
	| "fire"
	| "police"
	| "disaster_response"
	| "medical"
	| "rescue";

export type ServiceType = "ambulance" | "police" | "fire_truck" | "rescue_team";

export type ServiceStatus = "available" | "assigned" | "off_duty";

export interface IOrgLoginResponse {
	token: string;
	organization: {
		id: string;
		name: string;
		email: string;
		serviceCategory: ServiceCategory;
		role: string;
	};
	message?: string;
}

export interface IOrgRegisterResponse {
	userId?: string;
	message?: string;
}

export interface IOrgVerifyResponse {
	message?: string;
	verified?: boolean;
	token?: string;
}

export interface IOrgProfileResponse {
	id: string;
	name: string;
	email: string;
	serviceCategory: ServiceCategory;
	generalNumber: number;
	role: string;
}

// Service Provider Types
export interface IServiceProviderLoginResponse {
	token: string;
	serviceProvider: {
		id: string;
		name: string;
		email: string;
		phoneNumber: number;
		serviceType: ServiceType;
		serviceStatus: ServiceStatus;
		organizationId: string;
	};
	message?: string;
}

export interface IServiceProviderRegisterResponse {
	userId?: string;
	message?: string;
}

export interface IServiceProviderVerifyResponse {
	message?: string;
	verified?: boolean;
	token?: string;
}

export interface IServiceProviderProfileResponse {
	id: string;
	name: string;
	age: number;
	email: string;
	phoneNumber: number;
	primaryAddress: string;
	serviceArea: string;
	serviceType: ServiceType;
	serviceStatus: ServiceStatus;
	profilePicture?: string;
	isVerified: boolean;
	currentLocation?: {
		latitude: string;
		longitude: string;
	};
	vehicleInformation?: {
		type: string;
		number: string;
		model: string;
		color: string;
	};
	organizationId: string;
	organization?: {
		id: string;
		name: string;
		email: string;
		serviceCategory: ServiceCategory;
	};
	createdAt: string;
	updatedAt: string;
}
