import SafeAreaContainer from '@/components/SafeAreaContainer';
import Button from '@/components/ui/Button';
import InputBox from '@/components/ui/InputBox';
import { useLoginUser } from '@/services/user/auth.api';
import { useAuthStore } from '@/store/authStore';
import { ILoginResponse, IOtpResponse } from '@/types/auth.types';
import { loginUserSchema, TLoginUser } from '@/validations/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View, Image, Text, Alert, ActivityIndicator } from 'react-native';

const isLoginResponse = (data: ILoginResponse | IOtpResponse): data is ILoginResponse => {
  return 'token' in data && 'user' in data;
};

const SigninScreen: React.FC = () => {
  const router = useRouter();
  const { login: setAuth } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TLoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { mutate: loginMutation, isPending } = useLoginUser();

  const onSubmit = (data: TLoginUser) => {
    loginMutation(data, {
      onSuccess: (response) => {
        const responseData = response.data.data;

        if (isLoginResponse(responseData)) {
          const { token, user } = responseData;
          console.log('Login successful:', { user, token });
          setAuth(user, token);
          router.replace('/(tabs)');
        } else {
          const { otpToken, userId } = responseData;
          console.log('Redirecting to OTP with:', { otpToken, userId, email: data.email });
          router.replace({
            pathname: '/(auth)/verify-otp',
            params: {
              otpToken,
              userId,
              email: data.email,
            },
          });
        }
      },
      onError: (error: any) => {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Login failed. Please check your credentials.'
        );
      },
    });
  };

  return (
    <SafeAreaContainer>
      <View className="flex-1 items-center justify-evenly bg-white px-8 py-16">
        <View className="mb-6 h-40 w-48">
          <Image
            source={require('../../assets/resq-connect-logo.png')}
            resizeMode="contain"
            className="h-full w-full"
          />
        </View>

        <Text
          className="mb-2 text-4xl text-black"
          style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
          Sign In
        </Text>

        <Text className="mb-8 text-center text-base text-gray-600" style={{ fontFamily: 'Inter' }}>
          Enter your details to login
        </Text>

        <View className="mb-6 w-full gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputBox
                placeholder="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputBox
                placeholder="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />

          <Link
            href="/(auth)/forgot-password"
            className="mt-1 text-right text-base text-gray-600"
            style={{ fontFamily: 'Inter' }}>
            Forgot password?
          </Link>
        </View>

        <View className="mb-8">
          <Text className="text-center text-base text-gray-600" style={{ fontFamily: 'Inter' }}>
            Don&apos;t have an account?{' '}
          </Text>
          <Link
            href="/(auth)/sign-up"
            className="mt-1 text-center font-semibold text-black underline">
            Register
          </Link>
        </View>

        <Button
          label={isPending ? 'Logging in...' : 'Login'}
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}
        />
        {isPending && <ActivityIndicator className="mt-4" color="#E13333" />}
      </View>
      <View className="h-16 w-full bg-primary" />
    </SafeAreaContainer>
  );
};

export default SigninScreen;
