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
