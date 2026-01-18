import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../axiosInstance";
import { orgEndpoints } from "../endPoints";
import { AxiosError, AxiosResponse } from "axios";

import {
	TServiceProviderRegister,
	TServiceProviderUpdate,
} from "@/validations/service-provider.schema";

import { IServiceProviderProfileResponse } from "@/types/auth.types";

interface ApiResponse<T> {
	data: T;
	message?: string;
}

// Get all service providers for the organization
export const useOrgServiceProviders = (enabled: boolean = true) => {
	return useQuery<
		AxiosResponse<ApiResponse<IServiceProviderProfileResponse[]>>,
		AxiosError
	>({
		queryKey: ["orgServiceProviders"],
		queryFn: () => api.get(orgEndpoints.serviceProviders),
		enabled,
	});
};

// Get single service provider
export const useOrgServiceProvider = (id: string, enabled: boolean = true) => {
	return useQuery<
		AxiosResponse<ApiResponse<IServiceProviderProfileResponse>>,
		AxiosError
	>({
		queryKey: ["orgServiceProvider", id],
		queryFn: () => api.get(orgEndpoints.getProvider(id)),
		enabled: enabled && !!id,
	});
};

// Register new service provider
export const useOrgRegisterProvider = () => {
	const queryClient = useQueryClient();
	return useMutation<
		AxiosResponse<ApiResponse<{ userId: string; message: string }>>,
		AxiosError,
		TServiceProviderRegister
	>({
		mutationFn: (data) => api.post(orgEndpoints.serviceProviders, data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["orgServiceProviders"] });
		},
	});
};

// Update service provider
export const useOrgUpdateProvider = () => {
	const queryClient = useQueryClient();
	return useMutation<
		AxiosResponse<ApiResponse<IServiceProviderProfileResponse>>,
		AxiosError,
		{ id: string; data: TServiceProviderUpdate }
	>({
		mutationFn: ({ id, data }) => api.patch(orgEndpoints.updateProvider(id), data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["orgServiceProviders"] });
		},
	});
};

// Delete service provider
export const useOrgDeleteProvider = () => {
	const queryClient = useQueryClient();
	return useMutation<AxiosResponse<ApiResponse<{ message: string }>>, AxiosError, string>(
		{
			mutationFn: (id) => api.delete(orgEndpoints.deleteProvider(id)),
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["orgServiceProviders"] });
			},
		}
	);
};

// Verify service provider manually
export const useOrgVerifyProvider = () => {
	const queryClient = useQueryClient();
	return useMutation<AxiosResponse<ApiResponse<{ message: string }>>, AxiosError, string>(
		{
			mutationFn: (id) => api.post(orgEndpoints.verifyProvider(id)),
			onSuccess: () => {
				queryClient.invalidateQueries({ queryKey: ["orgServiceProviders"] });
			},
		}
	);
};
