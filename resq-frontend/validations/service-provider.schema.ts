import { z } from "zod";

export const serviceTypeEnum = z.enum([
	"ambulance",
	"police",
	"fire_truck",
	"rescue_team",
]);

export const serviceStatusEnum = z.enum(["available", "assigned", "off_duty"]);

export type ServiceType = z.infer<typeof serviceTypeEnum>;
export type ServiceStatus = z.infer<typeof serviceStatusEnum>;

// Registration Schema (used by organization to register providers)
export const serviceProviderRegisterSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	age: z
		.number()
		.int()
		.min(18, "Must be at least 18 years old")
		.max(65, "Must be under 65 years old"),
	email: z.string().email("Please enter a valid email"),
	phoneNumber: z.number().int().positive("Phone number is required"),
	primaryAddress: z.string().min(5, "Address must be at least 5 characters"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),
	serviceType: serviceTypeEnum,
});

// Form schema with string for numbers (converted before API call)
export const serviceProviderRegisterFormSchema = z
	.object({
		name: z.string().min(2, "Name must be at least 2 characters"),
		age: z.string().min(1, "Age is required"),
		email: z.string().email("Please enter a valid email"),
		phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
		primaryAddress: z.string().min(5, "Address must be at least 5 characters"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
			.regex(/[a-z]/, "Password must contain at least one lowercase letter")
			.regex(/[0-9]/, "Password must contain at least one number"),
		confirmPassword: z.string().min(1, "Please confirm your password"),
		serviceType: serviceTypeEnum,
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

// Update Profile Schema
export const serviceProviderUpdateSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters").optional(),
	age: z.number().int().min(18).max(65).optional(),
	primaryAddress: z.string().min(5).optional(),
	serviceArea: z.string().optional(),
	profilePicture: z.string().optional(),
	vehicleInformation: z
		.object({
			type: z.string(),
			number: z.string(),
			model: z.string(),
			color: z.string(),
		})
		.optional(),
});

// Type exports
export type TServiceProviderRegister = z.infer<typeof serviceProviderRegisterSchema>;
export type TServiceProviderRegisterForm = z.infer<
	typeof serviceProviderRegisterFormSchema
>;
export type TServiceProviderUpdate = z.infer<typeof serviceProviderUpdateSchema>;
