import { ApiResponseInterface } from "@/types";
import { AxiosResponse } from "axios";
import * as SecureStore from "expo-secure-store";
import { z } from "zod";

export function defineServiceStatus(serviceStatus: string): boolean {
	switch (serviceStatus.toLowerCase()) {
		case "assigned":
			return false;
		case "available":
			return true;
		case "off_duty":
			return false;
		default:
			return false;
	}
}

export const isValidEmail = (email: string) => {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
};

export const capitalizeFirstLetter = (string: string) => {
	return string.charAt(0).toUpperCase() + string.slice(1);
};

export const tryCatch = async (fn: () => Promise<any>, errorMessage: string) => {
	try {
		return await fn();
	} catch (error) {
		console.log("Error Occured: ", errorMessage, error);
		throw new Error(errorMessage);
	}
};

export const getServiceType = (service: string) => {
	switch (service.toLowerCase()) {
		case "police":
			return "police";
		case "fire":
			return "fire_truck";
		case "ambulance":
			return "ambulance";
		case "rescue":
			return "rescue_team";
		default:
			return "police";
	}
};

export const requestHandler = async (
	api: () => Promise<AxiosResponse<ApiResponseInterface, any>>,
	setLoading: ((loading: boolean) => void) | null,
	onSuccess: (data: ApiResponseInterface) => void,
	onError: (error: string) => void
) => {
	setLoading && setLoading(true);

	try {
		const response = await api();
		const { data } = response;
		if (data?.success) {
			onSuccess(data);
		}
	} catch (error: any) {
		if ([401, 403].includes(error?.response.data?.statusCode)) {
			await SecureStore.deleteItemAsync("token");
		}
		onError(error?.response?.data?.message || "Something went wrong");
	} finally {
		setLoading && setLoading(false);
	}
};

export const zodErrorHandler = (err: any, setErrors: (value: React.SetStateAction<Record<string, string>>) => void) => {
	if (err instanceof z.ZodError) {
		const fieldErrors = err.errors.reduce((acc: Record<string, string>, e) => {
			acc[e.path[0] as string] = e.message;
			return acc;
		}, {});
		setErrors(fieldErrors);
	}
};
