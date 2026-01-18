import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../axiosInstance';
import { userEndpoints, serviceProviderEndpoints } from '../endPoints';
import { AxiosError, AxiosResponse } from 'axios';

// Import request types from schemas
import {
  TLoginUser,
  TRegisterUser,
  TVerifyUser,
  TForgotPassword,
  TResetPassword,
  TChangePassword,
} from '@/validations/auth.schema';

// Import response types
import {
  ILoginResponse,
  IRegisterResponse,
  IVerifyResponse,
  IForgotPasswordResponse,
  IResetPasswordResponse,
  IChangePasswordResponse,
  IOtpResponse,
  IProfileResponse,
} from '@/types/auth.types';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

const useLoginUser = () => {
  return useMutation<
    AxiosResponse<ApiResponse<ILoginResponse | IOtpResponse>>,
    AxiosError,
    TLoginUser
  >({
    mutationFn: (loginData) => {
      return api.post(userEndpoints.login, loginData);
    },
  });
};

const useLoginServiceProvider = () => {
  return useMutation<AxiosResponse<ApiResponse<ILoginResponse>>, AxiosError, TLoginUser>({
    mutationFn: (loginData) => {
      return api.post(serviceProviderEndpoints.login, loginData);
    },
  });
};

const useRegisterUser = () => {
  return useMutation<AxiosResponse<ApiResponse<IRegisterResponse>>, AxiosError, TRegisterUser>({
    mutationFn: (userRegisterData) => {
      return api.post(userEndpoints.register, userRegisterData);
    },
  });
};

const useVerifyUser = () => {
  return useMutation<AxiosResponse<ApiResponse<IVerifyResponse>>, AxiosError, TVerifyUser>({
    mutationFn: (verifyData) => {
      return api.post(userEndpoints.verify, verifyData);
    },
  });
};

const useForgotPassword = () => {
  return useMutation<
    AxiosResponse<ApiResponse<IForgotPasswordResponse>>,
    AxiosError,
    TForgotPassword
  >({
    mutationFn: (forgotPasswordData) => {
      return api.post(userEndpoints.forgotPassword, forgotPasswordData);
    },
  });
};

const useResetPassword = () => {
  return useMutation<
    AxiosResponse<ApiResponse<IResetPasswordResponse>>,
    AxiosError,
    TResetPassword
  >({
    mutationFn: (resetPasswordData) => {
      return api.post(userEndpoints.resetPassword, resetPasswordData);
    },
  });
};

const useChangePassword = () => {
  return useMutation<
    AxiosResponse<ApiResponse<IChangePasswordResponse>>,
    AxiosError,
    TChangePassword
  >({
    mutationFn: (changePasswordData) => {
      return api.post(userEndpoints.changePassword, changePasswordData);
    },
  });
};

const useGetProfile = (enabled: boolean = true) => {
  return useQuery<AxiosResponse<ApiResponse<IProfileResponse>>, AxiosError>({
    queryKey: ['profile'],
    queryFn: () => api.get(userEndpoints.profile),
    enabled,
    retry: false,
  });
};

export {
  useLoginUser,
  useLoginServiceProvider,
  useRegisterUser,
  useVerifyUser,
  useForgotPassword,
  useResetPassword,
  useChangePassword,
  useGetProfile,
};
