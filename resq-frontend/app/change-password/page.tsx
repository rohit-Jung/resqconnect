"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	ShieldCheck,
	Lock,
	Eye,
	EyeOff,
	Loader2,
	ArrowLeft,
	CheckCircle,
	KeyRound,
} from "lucide-react";
import { changePasswordSchema, TChangePassword } from "@/validations/auth.schema";
import { useChangePassword } from "@/services/user/auth.api";

export default function ChangePasswordPage() {
	const [showOldPassword, setShowOldPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const router = useRouter();
	const changePasswordMutation = useChangePassword();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<TChangePassword>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: {
			oldPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});

	const onSubmit = (data: TChangePassword) => {
		changePasswordMutation.mutate(data, {
			onSuccess: () => {
				setIsSuccess(true);
				reset();
			},
			onError: (error) => {
				console.error("Change password failed:", error);
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
						Keep your account secure by regularly updating your password. Use a strong,
						unique password that you don&apos;t use elsewhere.
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

			{/* Right Side - Change Password Form */}
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
								<h2 className="text-3xl font-bold mb-2">Change Password</h2>
								<p className="text-muted-foreground">
									Enter your current password and choose a new one
								</p>
							</div>

							{changePasswordMutation.isError && (
								<div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
									{changePasswordMutation.error?.message ||
										"Failed to change password. Please check your current password."}
								</div>
							)}

							<form
								onSubmit={handleSubmit(onSubmit)}
								className="space-y-5"
							>
								<div className="space-y-2">
									<Label htmlFor="oldPassword">Current Password</Label>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
										<Input
											id="oldPassword"
											type={showOldPassword ? "text" : "password"}
											placeholder="Enter current password"
											className="pl-10 pr-10"
											{...register("oldPassword")}
										/>
										<button
											type="button"
											onClick={() => setShowOldPassword(!showOldPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										>
											{showOldPassword ? (
												<EyeOff className="h-5 w-5" />
											) : (
												<Eye className="h-5 w-5" />
											)}
										</button>
									</div>
									{errors.oldPassword && (
										<p className="text-sm text-red-500">{errors.oldPassword.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="newPassword">New Password</Label>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
										<Input
											id="newPassword"
											type={showNewPassword ? "text" : "password"}
											placeholder="Enter new password"
											className="pl-10 pr-10"
											{...register("newPassword")}
										/>
										<button
											type="button"
											onClick={() => setShowNewPassword(!showNewPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										>
											{showNewPassword ? (
												<EyeOff className="h-5 w-5" />
											) : (
												<Eye className="h-5 w-5" />
											)}
										</button>
									</div>
									{errors.newPassword && (
										<p className="text-sm text-red-500">{errors.newPassword.message}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="confirmPassword">Confirm New Password</Label>
									<div className="relative">
										<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
										<Input
											id="confirmPassword"
											type={showConfirmPassword ? "text" : "password"}
											placeholder="Confirm new password"
											className="pl-10 pr-10"
											{...register("confirmPassword")}
										/>
										<button
											type="button"
											onClick={() => setShowConfirmPassword(!showConfirmPassword)}
											className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
										>
											{showConfirmPassword ? (
												<EyeOff className="h-5 w-5" />
											) : (
												<Eye className="h-5 w-5" />
											)}
										</button>
									</div>
									{errors.confirmPassword && (
										<p className="text-sm text-red-500">
											{errors.confirmPassword.message}
										</p>
									)}
								</div>

								<div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
									<p className="font-medium mb-1">Password requirements:</p>
									<ul className="list-disc list-inside space-y-0.5">
										<li>At least 8 characters long</li>
										<li>One uppercase letter</li>
										<li>One lowercase letter</li>
										<li>One number</li>
										<li>One special character</li>
									</ul>
								</div>

								<Button
									type="submit"
									className="w-full h-12 text-base"
									size="lg"
									disabled={changePasswordMutation.isPending}
								>
									{changePasswordMutation.isPending ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Updating...
										</>
									) : (
										"Change Password"
									)}
								</Button>
							</form>

							<div className="mt-6 text-center">
								<Link
									href="/dashboard/settings"
									className="inline-flex items-center text-sm text-blue-600 hover:underline"
								>
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back to Settings
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
							<h2 className="text-3xl font-bold mb-2">Password Changed!</h2>
							<p className="text-muted-foreground mb-6">
								Your password has been successfully updated. Your account is now more
								secure.
							</p>
							<div className="space-y-3">
								<Button
									onClick={() => router.push("/dashboard")}
									className="w-full h-12 text-base"
									size="lg"
								>
									Go to Dashboard
								</Button>
								<Button
									onClick={() => setIsSuccess(false)}
									variant="outline"
									className="w-full h-12 text-base"
									size="lg"
								>
									Change Again
								</Button>
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
