import { useMutation } from '@tanstack/react-query';

import { AxiosError, AxiosResponse } from 'axios';
import { Alert } from 'react-native';

// Import response types
import {
  IChangePasswordResponse,
  IForgotPasswordResponse,
  ILoginResponse,
  IResetPasswordResponse,
  IVerifyResponse,
} from '@/types/auth.types';
// Import request types from schemas
import {
  TChangePassword,
  TForgotPassword,
  TLoginUser,
  TResetPassword,
  TVerifyUser,
} from '@/validations/auth.schema';

import api from '../axiosInstance';
import { serviceProviderEndpoints, userEndpoints } from '../endPoints';

interface ApiResponse<T> {
  data: T;
  message?: string;
}

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
    {
      email: string;
    }
  >({
    mutationFn: ({ email }) =>
      role === 'user'
        ? api.post(userEndpoints.resendOtp, { email })
        : api.post(serviceProviderEndpoints.resendOtp, { email }),
  });
};

const useForgotProviderPassword = () => {
  return useMutation<
    AxiosResponse<ApiResponse<IForgotPasswordResponse>>,
    AxiosError,
    TForgotPassword
  >({
    mutationFn: forgotPasswordData => {
      return api.post(
        serviceProviderEndpoints.forgotPassword,
        forgotPasswordData
      );
    },
  });
};

const useResetProviderPassword = () => {
  return useMutation<
    AxiosResponse<ApiResponse<IResetPasswordResponse>>,
    AxiosError,
    TResetPassword
  >({
    mutationFn: resetPasswordData => {
      return api.post(
        serviceProviderEndpoints.resetPassword,
        resetPasswordData
      );
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

export {
  useLoginServiceProvider,
  useVerify,
  useResendVerificationOTP,
  useForgotProviderPassword,
  useResetProviderPassword,
  useProviderChangePassword,
};
