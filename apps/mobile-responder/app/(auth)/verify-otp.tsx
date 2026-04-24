import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { useResendVerificationOTP, useVerify } from '@/services/user/auth.api';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

const VerifyOTPScreen: React.FC = () => {
  const router = useRouter();
  const { userId, email, role } = useLocalSearchParams<{
    userId: string;
    email: string;
    role: 'user' | 'service_provider';
  }>();

  const [otp, setOtp] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { mutate: verifyUser, isPending } = useVerify(role);
  const { mutate: resendOtp, isPending: isResending } =
    useResendVerificationOTP(role);

  const handleVerify = () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter the complete OTP');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'Invalid session. Please try again.');
      router.replace('/(auth)/sign-in');
      return;
    }

    verifyUser(
      // Backend expects different id field names per role.
      role === 'service_provider'
        ? { providerId: userId, otpToken: otp }
        : { userId, otpToken: otp },
      {
        onSuccess: () => {
          Alert.alert('Success', 'Verification completed. Please sign in.', [
            { text: 'OK', onPress: () => router.replace('/(auth)/sign-in') },
          ]);
        },
        onError: (error: any) => {
          Alert.alert(
            'Error',
            error.response?.data?.message ||
              'OTP verification failed. Please try again.'
          );
        },
      }
    );
  };

  const handleRequestAgain = () => {
    if (!email) {
      Alert.alert('Error', 'Missing email. Please go back and try again.');
      return;
    }

    resendOtp(
      { email },
      {
        onSuccess: () => {
          Alert.alert('Info', 'A new OTP has been sent to your email.');
        },
        onError: (error: any) => {
          Alert.alert(
            'Error',
            error.response?.data?.message ||
              'Failed to resend OTP. Please try again.'
          );
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandMark}>RESQ</Text>
          <Text style={styles.brandDot}>.</Text>
        </View>
        <View style={styles.headerLine} />
        <Text style={styles.tagline}>VERIFICATION</Text>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>ENTER CODE</Text>
        <Text style={styles.subtitle}>
          OTP sent to{'\n'}
          <Text style={styles.email}>{email || 'your email'}</Text>
        </Text>
      </View>

      {/* OTP Input */}
      <View style={styles.otpContainer}>
        {Array(6)
          .fill(0)
          .map((_, index) => (
            <View key={index} style={styles.otpInputWrapper}>
              <TextInput
                style={[styles.otpInput, otp[index] && styles.otpInputFilled]}
                ref={input => {
                  inputRefs.current[index] = input;
                }}
                maxLength={1}
                keyboardType="number-pad"
                onChangeText={text => {
                  const newOtp = otp.split('');
                  newOtp[index] = text;
                  const updatedOtp = newOtp.join('');
                  setOtp(updatedOtp);

                  if (text && index < inputRefs.current.length - 1) {
                    inputRefs.current[index + 1]?.focus();
                  }

                  if (
                    updatedOtp.length === inputRefs.current.length &&
                    !updatedOtp.includes('')
                  ) {
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
              {index < 5 && <View style={styles.otpDivider} />}
            </View>
          ))}
      </View>

      {/* Resend */}
      <TouchableOpacity
        style={styles.resendButton}
        onPress={handleRequestAgain}
        disabled={isPending || isResending}
        activeOpacity={0.7}
      >
        <Text style={styles.resendText}>DID NOT RECEIVE CODE? </Text>
        <Text style={styles.resendLink}>RESEND</Text>
      </TouchableOpacity>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, isPending && styles.submitButtonDisabled]}
        onPress={handleVerify}
        disabled={isPending}
        activeOpacity={0.8}
      >
        {isPending ? (
          <ActivityIndicator color={OFF_WHITE} />
        ) : (
          <Text style={styles.submitButtonText}>VERIFY</Text>
        )}
      </TouchableOpacity>

      {/* Metadata */}
      <View style={styles.metadata}>
        <Text style={styles.metadataText}>SECURE VERIFICATION</Text>
        <Text style={styles.metadataDot}>·</Text>
        <Text style={styles.metadataText}>10 MIN EXPIRY</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 48,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 36,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 6,
  },
  brandDot: {
    fontSize: 36,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 44,
  },
  headerLine: {
    width: 48,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 6,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  titleSection: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: MID_GRAY,
    marginTop: 8,
    letterSpacing: 1,
    lineHeight: 22,
  },
  email: {
    color: SIGNAL_RED,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otpInput: {
    width: 48,
    height: 64,
    borderBottomWidth: 2,
    borderBottomColor: MID_GRAY,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: BLACK,
  },
  otpInputFilled: {
    borderBottomColor: SIGNAL_RED,
  },
  otpDivider: {
    width: 16,
  },
  resendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  resendText: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 1,
  },
  resendLink: {
    fontSize: 11,
    fontWeight: '700',
    color: SIGNAL_RED,
    letterSpacing: 1,
  },
  submitButton: {
    height: 56,
    backgroundColor: SIGNAL_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: LIGHT_GRAY,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 3,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
  },
  metadataText: {
    fontSize: 9,
    color: MID_GRAY,
    letterSpacing: 2,
  },
  metadataDot: {
    fontSize: 9,
    color: SIGNAL_RED,
    marginHorizontal: 8,
  },
});

export default VerifyOTPScreen;
