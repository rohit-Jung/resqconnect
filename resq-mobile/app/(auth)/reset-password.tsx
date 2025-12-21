import SafeAreaContainer from '@/components/SafeAreaContainer';
import Button from '@/components/ui/Button';
import InputBox from '@/components/ui/InputBox';
import OTPInput from '@/components/ui/OTPInput';
import { useResetPassword } from '@/services/user/auth.api';
import { resetPasswordFormSchema, TResetPasswordForm } from '@/validations/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View, Image, Text, Alert, ActivityIndicator } from 'react-native';

const ResetPasswordScreen: React.FC = () => {
  const router = useRouter();
  const { userId, email } = useLocalSearchParams<{ userId: string; email: string }>();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TResetPasswordForm>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      otpToken: '',
      password: '',
      confirmPassword: '',
    },
  });

  const { mutate: resetPassword, isPending } = useResetPassword();

  const handleOTPComplete = (otp: string) => {
    setValue('otpToken', otp);
  };

  const onSubmit = (data: TResetPasswordForm) => {
    if (!userId) {
      Alert.alert('Error', 'Invalid session. Please try again.');
      router.replace('/(auth)/forgot-password');
      return;
    }

    resetPassword(
      {
        userId,
        otpToken: data.otpToken,
        password: data.password,
      },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Password reset successfully!', [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/sign-in'),
            },
          ]);
        },
        onError: (error: any) => {
          Alert.alert(
            'Error',
            error.response?.data?.message || 'Failed to reset password. Please try again.'
          );
        },
      }
    );
  };

  return (
    <SafeAreaContainer>
      <View className="flex-1 items-center justify-start bg-white px-8 pt-12">
        {/* Logo */}
        <View className="mb-6 h-32 w-40">
          <Image
            source={require('../../assets/resq-connect-logo.png')}
            resizeMode="contain"
            className="h-full w-full"
          />
        </View>

        {/* Title */}
        <Text
          className="mb-2 text-3xl text-black"
          style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
          Reset Password
        </Text>

        {/* Subtitle */}
        <Text className="mb-6 text-center text-base text-gray-600" style={{ fontFamily: 'Inter' }}>
          Enter the OTP sent to{'\n'}
          <Text className="font-semibold">{email || 'your email'}</Text>
        </Text>

        {/* OTP Input */}
        <View className="mb-6 w-full">
          <Text className="mb-2 text-sm text-gray-600" style={{ fontFamily: 'Inter' }}>
            Enter OTP
          </Text>
          <OTPInput length={6} onComplete={handleOTPComplete} />
          {errors.otpToken && (
            <Text className="mt-1 text-sm text-red-500">{errors.otpToken.message}</Text>
          )}
        </View>

        {/* Password Inputs */}
        <View className="mb-6 w-full gap-3">
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputBox
                placeholder="New Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputBox
                placeholder="Confirm New Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry
                error={errors.confirmPassword?.message}
              />
            )}
          />
        </View>

        {/* Password Requirements */}
        <View className="mb-6 w-full">
          <Text className="text-xs text-gray-500" style={{ fontFamily: 'Inter' }}>
            Password must contain at least 8 characters, one uppercase, one lowercase, one number,
            and one special character.
          </Text>
        </View>

        {/* Submit Button */}
        <Button
          label={isPending ? 'Resetting...' : 'Reset Password'}
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}
        />
        {isPending && <ActivityIndicator className="mt-4" color="#E13333" />}
      </View>
      <View className="h-16 w-full bg-primary" />
    </SafeAreaContainer>
  );
};

export default ResetPasswordScreen;
