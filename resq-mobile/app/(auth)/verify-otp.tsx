import SafeAreaContainer from '@/components/SafeAreaContainer';
import { useVerifyUser } from '@/services/user/auth.api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
  TextInput,
  Keyboard,
} from 'react-native';

const VerifyOTPScreen: React.FC = () => {
  const router = useRouter();
  const { userId, email } = useLocalSearchParams<{
    userId: string;
    email: string;
  }>();

  const [otp, setOtp] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { mutate: verifyUser, isPending } = useVerifyUser();

  const handleVerify = () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'Invalid session. Please try again.');
      router.replace('/(auth)/sign-up');
      return;
    }

    verifyUser(
      { userId, otpToken: otp },
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
    Alert.alert('Info', 'A new OTP has been sent to your email.');
  };

  return (
    <SafeAreaContainer style={styles.safeArea} scrollable={false}>
      <View style={styles.container}>
        {/* Logo */}
        <Image
          source={require('../../assets/resq-connect-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Title */}
        <Text style={styles.title}>Enter OTP</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          An OTP Has Been Sent To your linked email
          {email ? `\n${email}` : ''}
        </Text>

        {/* OTP Input */}
        <View style={styles.otpInputContainer}>
          {Array(6)
            .fill(0)
            .map((_, index) => (
              <TextInput
                key={index}
                style={styles.otpInput}
                ref={(input) => {
                  inputRefs.current[index] = input;
                }}
                maxLength={1}
                keyboardType="number-pad"
                onChangeText={(text) => {
                  const newOtp = otp.split('');
                  newOtp[index] = text;
                  const updatedOtp = newOtp.join('');
                  setOtp(updatedOtp);

                  if (text && index < inputRefs.current.length - 1) {
                    inputRefs.current[index + 1]?.focus();
                  }

                  if (updatedOtp.length === inputRefs.current.length && !updatedOtp.includes('')) {
                    Keyboard.dismiss();
                  }
                }}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && !otp[index]) {
                    inputRefs.current[index - 1]?.focus();
                  }
                }}
                editable={!isPending}
              />
            ))}
        </View>

        {/* Resend */}
        <Text style={styles.resendText}>
          Didn&apos;t Get The Code?{' '}
          <Text style={styles.resendLink} onPress={handleRequestAgain}>
            Request Again
          </Text>
        </Text>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.button, isPending && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1F2937',
    fontFamily: 'ChauPhilomeneOne_400Regular',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
    backgroundColor: '#F9FAFB',
    color: '#1F2937',
    fontFamily: 'Inter',
  },
  resendText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  resendLink: {
    fontWeight: 'bold',
    color: '#E13333',
  },
  button: {
    backgroundColor: '#E13333',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
});

export default VerifyOTPScreen;
