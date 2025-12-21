import SafeAreaContainer from '@/components/SafeAreaContainer';
import Button from '@/components/ui/Button';
import InputBox from '@/components/ui/InputBox';
import { useForgotPassword } from '@/services/user/auth.api';
import { forgotPasswordSchema, TForgotPassword } from '@/validations/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View, Image, Text, Alert, ActivityIndicator } from 'react-native';

const ForgotPasswordScreen: React.FC = () => {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TForgotPassword>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const { mutate: forgotPassword, isPending } = useForgotPassword();

  const onSubmit = (data: TForgotPassword) => {
    forgotPassword(data, {
      onSuccess: (response) => {
        const userId = response.data?.data.userId;
        router.push({
          pathname: '/(auth)/reset-password',
          params: { userId, email: data.email },
        });
      },
      onError: (error: any) => {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to send OTP. Please try again.'
        );
      },
    });
  };

  return (
    <SafeAreaContainer>
      <View className="flex-1 items-center justify-start bg-white px-8 pt-20">
        {/* Logo */}
        <View className="mb-8 h-40 w-48">
          <Image
            source={require('../../assets/resq-connect-logo.png')}
            resizeMode="contain"
            className="h-full w-full"
          />
        </View>

        {/* Title */}
        <Text
          className="mb-3 text-3xl text-black"
          style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
          Forgot Password
        </Text>

        {/* Subtitle */}
        <Text className="mb-8 text-center text-base text-gray-600" style={{ fontFamily: 'Inter' }}>
          Enter your email address to receive{'\n'}a password reset OTP.
        </Text>

        {/* Email Input */}
        <View className="mb-6 w-full">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputBox
                placeholder="Email Address"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email?.message}
              />
            )}
          />
        </View>

        {/* Back to Login Link */}
        <View className="mb-8">
          <Text className="text-center text-base text-gray-600" style={{ fontFamily: 'Inter' }}>
            Remember your password?{' '}
          </Text>
          <Link
            href="/(auth)/sign-in"
            className="mt-1 text-center font-semibold text-black underline">
            Back to Login
          </Link>
        </View>

        {/* Submit Button */}
        <Button
          label={isPending ? 'Sending...' : 'Send OTP'}
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}
        />
        {isPending && <ActivityIndicator className="mt-4" color="#E13333" />}
      </View>
      <View className="h-16 w-full bg-primary" />
    </SafeAreaContainer>
  );
};

export default ForgotPasswordScreen;
