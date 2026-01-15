"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { forgotPasswordSchema, TForgotPassword } from "@/validations/auth.schema";
import { useForgotPassword } from "@/services/user/auth.api";

export default function ForgotPasswordPage() {
	const [isSubmitted, setIsSubmitted] = useState(false);
	const router = useRouter();
	const forgotPasswordMutation = useForgotPassword();

	const {
		register,
		handleSubmit,
		formState: { errors },
		getValues,
	} = useForm<TForgotPassword>({
		resolver: zodResolver(forgotPasswordSchema),
		defaultValues: {
			email: "",
		},
	});

	const onSubmit = (data: TForgotPassword) => {
		forgotPasswordMutation.mutate(data, {
			onSuccess: (response) => {
				setIsSubmitted(true);
				const userId = response.data.data?.userId;
				// Store userId for reset password page
				if (userId) {
					sessionStorage.setItem("resetPasswordUserId", userId);
				}
			},
			onError: (error) => {
				console.error("Forgot password failed:", error);
			},
		});
	};

	const handleContinueToReset = () => {
		router.push("/reset-password");
	};

	return (
		<div className="min-h-screen flex">
			{/* Left Side - Red Background */}
			<div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#C53030] to-[#7A1F1F] text-white flex-col justify-between p-12">
				<div className="flex flex-col items-center justify-center flex-1 text-center">
					<div className="flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm p-6 mb-6">
						<ShieldCheck className="h-16 w-16" />
					</div>
					<h1 className="text-5xl font-bold mb-2">ResqConnect</h1>
					<p className="text-xl mb-8 opacity-90">Emergency Response Platform</p>

					<p className="text-lg max-w-md mb-16 leading-relaxed opacity-90">
						Don&apos;t worry! We&apos;ll help you recover access to your account securely
						and quickly.
					</p>

					<div className="flex gap-16">
						<div className="flex flex-col items-center">
							<p className="text-4xl font-bold mb-1">24/7</p>
							<p className="text-sm opacity-90">Support</p>
						</div>
						<div className="flex flex-col items-center">
							<p className="text-4xl font-bold mb-1">99.9%</p>
							<p className="text-sm opacity-90">Uptime</p>
						</div>
						<div className="flex flex-col items-center">
							<p className="text-4xl font-bold mb-1">30s</p>
							<p className="text-sm opacity-90">Response</p>
						</div>
					</div>
				</div>
			</div>

			{/* Right Side - Forgot Password Form */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-muted/30">
				<div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8">
					{!isSubmitted ? (
						<>
							<div className="mb-8 text-center">
								<h2 className="text-3xl font-bold mb-2">Forgot Password?</h2>
								<p className="text-muted-foreground">
									Enter your email and we&apos;ll send you a reset code
								</p>
							</div>

							{forgotPasswordMutation.isError && (
								<div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
									{forgotPasswordMutation.error?.message ||
										"Failed to send reset email. Please try again."}
								</div>
							)}

							<form
								onSubmit={handleSubmit(onSubmit)}
								className="space-y-5"
							>
								<div className="space-y-2">
									<Label htmlFor="email">Email address</Label>
									<div className="relative">
										<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
										<Input
											id="email"
											type="email"
											placeholder="Enter your email"
											className="pl-10"
											{...register("email")}
										/>
									</div>
									{errors.email && (
										<p className="text-sm text-red-500">{errors.email.message}</p>
									)}
								</div>

								<Button
									type="submit"
									className="w-full h-12 text-base"
									size="lg"
									disabled={forgotPasswordMutation.isPending}
								>
									{forgotPasswordMutation.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Sending...
										</>
									) : (
										"Send Reset Code"
									)}
								</Button>
							</form>

							<div className="mt-6 text-center">
								<Link
									href="/login"
									className="inline-flex items-center text-sm text-blue-600 hover:underline"
								>
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back to Sign in
								</Link>
							</div>
						</>
					) : (
						<div className="text-center">
							<div className="flex justify-center mb-6">
								<div className="rounded-full bg-green-100 p-4">
									<CheckCircle className="h-12 w-12 text-green-600" />
								</div>
							</div>
							<h2 className="text-3xl font-bold mb-2">Check your email</h2>
							<p className="text-muted-foreground mb-6">
								We&apos;ve sent a password reset code to{" "}
								<span className="font-medium text-foreground">{getValues("email")}</span>
							</p>
							<p className="text-sm text-muted-foreground mb-6">
								Didn&apos;t receive the email? Check your spam folder or{" "}
								<button
									type="button"
									onClick={() => setIsSubmitted(false)}
									className="text-blue-600 hover:underline"
								>
									try another email
								</button>
							</p>
							<Button
								onClick={handleContinueToReset}
								className="w-full h-12 text-base"
								size="lg"
							>
								Continue to Reset Password
							</Button>
							<div className="mt-6">
								<Link
									href="/login"
									className="inline-flex items-center text-sm text-blue-600 hover:underline"
								>
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back to Sign in
								</Link>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Footer Links */}
			<div className="absolute bottom-4 left-1/2 -translate-x-1/2 lg:left-auto lg:right-1/2 lg:translate-x-1/2 flex gap-6 text-sm text-muted-foreground">
				<Link
					href="/help"
					className="hover:text-foreground"
				>
					Help Center
				</Link>
				<Link
					href="/support"
					className="hover:text-foreground"
				>
					Contact Support
				</Link>
				<Link
					href="/guide"
					className="hover:text-foreground"
				>
					Emergency Guide
				</Link>
			</div>
		</div>
	);
}
