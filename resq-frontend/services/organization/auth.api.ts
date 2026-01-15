import { useMutation, useQuery } from "@tanstack/react-query";
import api from "../axiosInstance";
import { orgEndpoints } from "../endPoints";
import { AxiosError, AxiosResponse } from "axios";

// Import request types from schemas
import { TOrgLogin, TOrgRegister, TOrgVerify } from "@/validations/org.schema";

// Import response types
import {
	IOrgLoginResponse,
	IOrgRegisterResponse,
	IOrgVerifyResponse,
	IOrgProfileResponse,
	IOtpResponse,
} from "@/types/auth.types";

interface ApiResponse<T> {
	data: T;
	message?: string;
}

const useOrgLogin = () => {
	return useMutation<
		AxiosResponse<ApiResponse<IOrgLoginResponse | IOtpResponse>>,
		AxiosError,
		TOrgLogin
	>({
		mutationFn: (loginData) => {
			return api.post(orgEndpoints.login, loginData);
		},
	});
};

const useOrgRegister = () => {
	return useMutation<
		AxiosResponse<ApiResponse<IOrgRegisterResponse>>,
		AxiosError,
		TOrgRegister
	>({
		mutationFn: (registerData) => {
			return api.post(orgEndpoints.register, registerData);
		},
	});
};

const useOrgVerify = () => {
	return useMutation<
		AxiosResponse<ApiResponse<IOrgVerifyResponse>>,
		AxiosError,
		TOrgVerify
	>({
		mutationFn: (verifyData) => {
			return api.post(orgEndpoints.verify, verifyData);
		},
	});
};

const useOrgProfile = (enabled: boolean = true) => {
	return useQuery<AxiosResponse<ApiResponse<IOrgProfileResponse>>, AxiosError>({
		queryKey: ["orgProfile"],
		queryFn: () => api.get(orgEndpoints.profile),
		enabled,
	});
};

export { useOrgLogin, useOrgRegister, useOrgVerify, useOrgProfile };
