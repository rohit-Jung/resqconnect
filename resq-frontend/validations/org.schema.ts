import { z } from "zod";

export const serviceCategoryEnum = z.enum([
	"ambulance",
	"fire",
	"police",
	"disaster_response",
	"medical",
	"rescue",
]);

export type ServiceCategory = z.infer<typeof serviceCategoryEnum>;

export const orgLoginSchema = z.object({
	email: z.string().email("Please enter a valid email"),
	password: z.string().min(1, "Password is required"),
});

export const orgRegisterSchema = z.object({
	name: z.string().min(2, "Organization name must be at least 2 characters"),
	serviceCategory: serviceCategoryEnum,
	email: z.string().email("Please enter a valid email"),
	generalNumber: z.number().int().positive("General number is required"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),
});

// Form schema with string for generalNumber (converted before API call)
export const orgRegisterFormSchema = z
	.object({
		name: z.string().min(2, "Organization name must be at least 2 characters"),
		serviceCategory: serviceCategoryEnum,
		email: z.string().email("Please enter a valid email"),
		generalNumber: z.string().min(1, "Emergency number is required"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
			.regex(/[a-z]/, "Password must contain at least one lowercase letter")
			.regex(/[0-9]/, "Password must contain at least one number"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const orgVerifySchema = z.object({
	userId: z.string().min(1, "User ID is required"),
	otpToken: z.string().length(6, "OTP must be 6 digits"),
});

export type TOrgLogin = z.infer<typeof orgLoginSchema>;
export type TOrgRegister = z.infer<typeof orgRegisterSchema>;
export type TOrgRegisterForm = z.infer<typeof orgRegisterFormSchema>;
export type TOrgVerify = z.infer<typeof orgVerifySchema>;
