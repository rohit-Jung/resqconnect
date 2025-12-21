import SafeAreaContainer from '@/components/SafeAreaContainer';
import Button from '@/components/ui/Button';
import OTPInput from '@/components/ui/OTPInput';
import { useVerifyUser } from '@/services/user/auth.api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View, Image, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';

const VerifyOTPScreen: React.FC = () => {
  const router = useRouter();
  const { userId, email } = useLocalSearchParams<{
    userId: string;
    email: string;
  }>();

  const [otpToken, setOtpToken] = useState('');
  const { mutate: verifyUser, isPending } = useVerifyUser();

  const handleOTPComplete = (otp: string) => {
    setOtpToken(otp);
  };

  const handleVerify = () => {
    if (!otpToken || otpToken.length !== 6) {
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'Invalid session. Please try again.');
      router.replace('/(auth)/sign-up');
      return;
    }

    verifyUser(
      { userId, otpToken },
      {
        onSuccess: () => {
          router.push('/(auth)/completing-registration');
        },
        onError: (error: any) => {
          Alert.alert(
            'Error',
            error.response?.data?.message || 'OTP verification failed. Please try again.'
          );
        },
      }
    );
  };

  const handleRequestAgain = () => {
    // TODO: Implement resend OTP API
    Alert.alert('Info', 'A new OTP has been sent to your email.');
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
        <Text className="mb-3 text-3xl text-black" style={{ fontFamily: 'ChauPhilomeneOne' }}>
          Enter OTP
        </Text>

        {/* Subtitle */}
        <Text className="mb-8 text-center text-base text-gray-600" style={{ fontFamily: 'Inter' }}>
          Enter The OTP Received In Your Email
          {email ? `\n${email}` : '.'}
        </Text>

        {/* OTP Input */}
        <View className="mb-6 w-full">
          <OTPInput length={6} onComplete={handleOTPComplete} />
        </View>

        {/* Request Again */}
        <View className="mb-8 items-center">
          <Text className="text-base text-gray-600" style={{ fontFamily: 'Inter' }}>
            Didn&apos;t Get The Code?
          </Text>
          <TouchableOpacity onPress={handleRequestAgain}>
            <Text
              className="text-base font-semibold text-black underline"
              style={{ fontFamily: 'Inter' }}>
              Request Again
            </Text>
          </TouchableOpacity>
        </View>

        {/* Verify Button */}
        <Button
          label={isPending ? 'Verifying...' : 'Verify OTP'}
          onPress={handleVerify}
          disabled={isPending}
        />
        {isPending && <ActivityIndicator className="mt-4" color="#E13333" />}
      </View>
      <View className="h-16 w-full bg-primary" />
    </SafeAreaContainer>
  );
};

export default VerifyOTPScreen;
