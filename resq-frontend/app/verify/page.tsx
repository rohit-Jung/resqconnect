"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { verifyUserSchema, TVerifyUser } from "@/validations/auth.schema";
import { useVerifyUser } from "@/services/user/auth.api";
import { useOrgVerify } from "@/services/organization/auth.api";

function VerifyPageContent() {
	const [isSuccess, setIsSuccess] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();
	const userId = searchParams.get("userId");
	const verifyMutation = useOrgVerify();

	const {
		register,
		handleSubmit,
		formState: { errors },
		setValue,
	} = useForm<TVerifyUser>({
		resolver: zodResolver(verifyUserSchema),
		defaultValues: {
			userId: userId || "",
			otpToken: "",
		},
	});

	useEffect(() => {
		if (userId) {
			setValue("userId", userId);
		}
	}, [userId, setValue]);

	const onSubmit = (data: TVerifyUser) => {
		verifyMutation.mutate(data, {
			onSuccess: (response) => {
				setIsSuccess(true);
				// If token is returned, store it
				if (response.data.data?.token) {
					localStorage.setItem("token", response.data.data.token);
				}
			},
			onError: (error) => {
				console.error("Verification failed:", error);
			},
		});
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
						We&apos;ve sent a verification code to your email. Enter the code to complete
						your account setup and start using ResqConnect.
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

			{/* Right Side - Verify Form */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-muted/30">
				<div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8">
					{!isSuccess ? (
						<>
							<div className="mb-8 text-center">
								<div className="flex justify-center mb-4">
									<div className="rounded-full bg-blue-100 p-3">
										<KeyRound className="h-8 w-8 text-blue-600" />
									</div>
								</div>
								<h2 className="text-3xl font-bold mb-2">Verify Your Account</h2>
								<p className="text-muted-foreground">
									Enter the 6-digit code sent to your email
								</p>
							</div>

							{verifyMutation.isError && (
								<div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
									{verifyMutation.error?.message ||
										"Verification failed. Please check your code and try again."}
								</div>
							)}

							{!userId && (
								<div className="mb-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
									Invalid verification link. Please{" "}
									<Link
										href="/signup"
										className="underline font-medium"
									>
										sign up again
									</Link>{" "}
									or{" "}
									<Link
										href="/login"
										className="underline font-medium"
									>
										login
									</Link>
									.
								</div>
							)}

							<form
								onSubmit={handleSubmit(onSubmit)}
								className="space-y-5"
							>
								<input
									type="hidden"
									{...register("userId")}
								/>

								<div className="space-y-2">
									<Label htmlFor="otpToken">Verification Code</Label>
									<div className="relative">
										<KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
										<Input
											id="otpToken"
											type="text"
											placeholder="Enter 6-digit code"
											className="pl-10 text-center tracking-[0.5em] text-lg font-mono"
											maxLength={6}
											{...register("otpToken")}
										/>
									</div>
									{errors.otpToken && (
										<p className="text-sm text-red-500">{errors.otpToken.message}</p>
									)}
									{errors.userId && (
										<p className="text-sm text-red-500">{errors.userId.message}</p>
									)}
								</div>

								<Button
									type="submit"
									className="w-full h-12 text-base"
									size="lg"
									disabled={verifyMutation.isPending || !userId}
								>
									{verifyMutation.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Verifying...
										</>
									) : (
										"Verify Account"
									)}
								</Button>
							</form>

							<div className="mt-6 text-center space-y-3">
								<p className="text-sm text-muted-foreground">
									Didn&apos;t receive the code?{" "}
									<button
										type="button"
										className="text-blue-600 hover:underline"
										onClick={() => {
											// TODO: Implement resend OTP functionality
											console.log("Resend OTP");
										}}
									>
										Resend code
									</button>
								</p>
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
							<h2 className="text-3xl font-bold mb-2">Account Verified!</h2>
							<p className="text-muted-foreground mb-6">
								Your account has been successfully verified. You can now access all
								features of ResqConnect.
							</p>
							<Button
								onClick={() => router.push("/dashboard")}
								className="w-full h-12 text-base"
								size="lg"
							>
								Go to Dashboard
							</Button>
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

export default function VerifyPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<VerifyPageContent />
		</Suspense>
	);
}
