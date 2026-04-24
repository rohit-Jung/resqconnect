import { useMutation, useQuery } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';
import { Alert } from 'react-native';

// Import response types
import {
  IChangePasswordResponse,
  IForgotPasswordResponse,
  ILoginResponse,
  IOtpResponse,
  IProfileResponse,
  IRegisterResponse,
  IResetPasswordResponse,
  IVerifyResponse,
} from '@/types/auth.types';
// Import request types from schemas
import {
  TChangePassword,
  TForgotPassword,
  TLoginUser,
  TRegisterUser,
  TResetPassword,
  TVerifyUser,
} from '@/validations/auth.schema';

import api from '../axiosInstance';
import { serviceProviderEndpoints, userEndpoints } from '../endPoints';

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
    mutationFn: loginData => {
      return api.post(userEndpoints.login, loginData);
    },
  });
};

const useLoginServiceProvider = () => {
  return useMutation<
    AxiosResponse<ApiResponse<ILoginResponse>>,
    AxiosError,
    TLoginUser
  >({
    mutationFn: loginData => {
      return api.post(serviceProviderEndpoints.login, loginData);
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          'Login failed. Please check your credentials.'
      );
    },
  });
};

const useRegisterUser = () => {
  return useMutation<
    AxiosResponse<ApiResponse<IRegisterResponse>>,
    AxiosError,
    TRegisterUser
  >({
    mutationFn: userRegisterData => {
      return api.post(userEndpoints.register, userRegisterData);
    },
  });
};

const useVerify = (role: 'user' | 'service_provider') => {
  return useMutation<
    AxiosResponse<ApiResponse<IVerifyResponse>>,
    AxiosError,
    TVerifyUser
  >({
    mutationFn: verifyData =>
      role === 'user'
        ? api.post(userEndpoints.verify, verifyData)
        : api.post(serviceProviderEndpoints.verify, verifyData),
  });
};

const useResendVerificationOTP = (role: 'user' | 'service_provider') => {
  return useMutation<
    AxiosResponse<ApiResponse<{ userId?: string; serviceProviderId?: string }>>,
    AxiosError,
    { email: string }
  >({
    mutationFn: ({ email }) =>
      role === 'user'
        ? api.post(userEndpoints.resendOtp, { email })
        : api.post(serviceProviderEndpoints.resendOtp, { email }),
  });
};

const useForgotPassword = () => {
  return useMutation<
    AxiosResponse<ApiResponse<IForgotPasswordResponse>>,
    AxiosError,
    TForgotPassword
  >({
    mutationFn: forgotPasswordData => {
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
    mutationFn: resetPasswordData => {
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
    mutationFn: changePasswordData => {
      return api.post(userEndpoints.changePassword, changePasswordData);
    },
  });
};

const useProviderChangePassword = () => {
  return useMutation<
    AxiosResponse<ApiResponse<IChangePasswordResponse>>,
    AxiosError,
    TChangePassword
  >({
    mutationFn: changePasswordData => {
      return api.post(
        serviceProviderEndpoints.changePassword,
        changePasswordData
      );
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
  useVerify,
  useResendVerificationOTP,
  useForgotPassword,
  useResetPassword,
  useChangePassword,
  useProviderChangePassword,
  useGetProfile,
};
