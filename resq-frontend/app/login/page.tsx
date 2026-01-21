"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginUserSchema, TLoginUser } from "@/validations/auth.schema";
import { useLoginUser } from "@/services/user/auth.api";
import { ILoginResponse, IOrgLoginResponse, IOtpResponse } from "@/types/auth.types";
import { useOrgLogin } from "@/services/organization/auth.api";

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false);
	const router = useRouter();
	const loginMutation = useOrgLogin();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<TLoginUser>({
		resolver: zodResolver(loginUserSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = (data: TLoginUser) => {
		loginMutation.mutate(data, {
			onSuccess: (response) => {
				const responseData = response.data.data;

				if ("otpToken" in responseData) {
					const otpData = responseData as IOtpResponse;
					router.push(`/verify?userId=${otpData.userId}`);
				} else {
					const loginData = responseData as IOrgLoginResponse;
					if (loginData.token) {
						localStorage.setItem("token", loginData.token);
					}
					router.push("/dashboard");
				}
			},
			onError: (error) => {
				console.error("Login failed:", error);
			},
		});
	};

	return (
		<div className="min-h-screen flex">
			{/* Left Side - Red Background */}
			<div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-[#C53030] to-[#7A1F1F] text-white flex-col justify-between p-12">
				<div className="flex flex-col items-center justify-center flex-1 text-center">
					<div className="flex items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm p-6 mb-6">
						<ShieldCheck className="h-16 w-16" />
					</div>
					<h1 className="text-5xl font-bold mb-2">ResqConnect</h1>
					<p className="text-xl mb-8 opacity-90">Emergency Response Platform</p>

					<p className="text-lg max-w-md mb-16 leading-relaxed opacity-90">
						Connect with emergency services instantly. Your safety is our priority with
						real-time location tracking and rapid response coordination.
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

			{/* Right Side - Login Form */}
			<div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-muted/30">
				<div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8">
					<div className="mb-8 text-center">
						<h2 className="text-3xl font-bold mb-2">Welcome back</h2>
						<p className="text-muted-foreground">Sign in to your account</p>
					</div>

					{loginMutation.isError && (
						<div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
							{loginMutation.error?.message || "Login failed. Please try again."}
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

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									placeholder="Enter your password"
									className="pl-10 pr-10"
									{...register("password")}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5" />
									) : (
										<Eye className="h-5 w-5" />
									)}
								</button>
							</div>
							{errors.password && (
								<p className="text-sm text-red-500">{errors.password.message}</p>
							)}
						</div>

						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Checkbox id="remember" />
								<Label
									htmlFor="remember"
									className="text-sm font-normal cursor-pointer"
								>
									Remember me
								</Label>
							</div>
							<Link
								href="/forgot-password"
								className="text-sm text-blue-600 hover:underline"
							>
								Forgot password?
							</Link>
						</div>

						<Button
							type="submit"
							className="w-full h-12 text-base"
							size="lg"
							disabled={loginMutation.isPending}
						>
							{loginMutation.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Signing in...
								</>
							) : (
								"Sign in"
							)}
						</Button>

						<div className="relative my-6">
							<div className="absolute inset-0 flex items-center">
								<div className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-sm">
								<span className="px-4 bg-card text-muted-foreground">
									Or continue with
								</span>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<Button
								variant="outline"
								type="button"
								className="h-12"
							>
								<svg
									className="w-5 h-5 mr-2"
									viewBox="0 0 24 24"
								>
									<path
										fill="#4285F4"
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
									/>
									<path
										fill="#34A853"
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
									/>
									<path
										fill="#FBBC05"
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
									/>
									<path
										fill="#EA4335"
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
									/>
								</svg>
								Google
							</Button>
							<Button
								variant="outline"
								type="button"
								className="h-12"
							>
								<svg
									className="w-5 h-5 mr-2"
									viewBox="0 0 24 24"
								>
									<path
										fill="#00A4EF"
										d="M11.4 0H0v11.4h11.4V0z"
									/>
									<path
										fill="#FFB900"
										d="M24 0H12.6v11.4H24V0z"
									/>
									<path
										fill="#7FBA00"
										d="M11.4 12.6H0V24h11.4V12.6z"
									/>
									<path
										fill="#F25022"
										d="M24 12.6H12.6V24H24V12.6z"
									/>
								</svg>
								Microsoft
							</Button>
						</div>
					</form>

					<p className="text-center text-sm text-muted-foreground mt-6">
						Don&apos;t have an account?{" "}
						<Link
							href="/signup"
							className="text-blue-600 hover:underline font-medium"
						>
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
