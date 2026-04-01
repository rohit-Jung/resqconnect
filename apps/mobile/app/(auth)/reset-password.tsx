import { zodResolver } from '@hookform/resolvers/zod';

import { useLocalSearchParams, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Header from '@/components/Header';
import OTPInput from '@/components/ui/OTPInput';
import { useResetPassword } from '@/services/user/auth.api';
import {
  TResetPasswordForm,
  resetPasswordFormSchema,
} from '@/validations/auth.schema';

const SIGNAL_RED = '#C44536';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

const ResetPasswordScreen: React.FC = () => {
  const router = useRouter();
  const { userId, email } = useLocalSearchParams<{
    userId: string;
    email: string;
  }>();

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
      Alert.alert('ERROR', 'Invalid session. Please try again.');
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
          Alert.alert('SUCCESS', 'Password reset successfully!', [
            {
              text: 'OK',
              onPress: () => router.replace('/(auth)/sign-in'),
            },
          ]);
        },
        onError: (error: any) => {
          Alert.alert(
            'ERROR',
            error.response?.data?.message ||
              'Failed to reset password. Please try again.'
          );
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <Header title="RESET PASSWORD" showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>RESET PASSWORD</Text>
            <Text style={styles.subtitle}>
              Enter the OTP sent to{'\n'}
              <Text style={styles.emailText}>{email || 'your email'}</Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpSection}>
            <Text style={styles.inputLabel}>ENTER OTP</Text>
            <OTPInput length={6} onComplete={handleOTPComplete} />
            {errors.otpToken && (
              <Text style={styles.errorText}>{errors.otpToken.message}</Text>
            )}
          </View>

          {/* Password Inputs */}
          <View style={styles.inputSection}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter new password"
                      placeholderTextColor={MID_GRAY}
                      secureTextEntry
                      editable={!isPending}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                  </View>
                  {errors.password && (
                    <Text style={styles.errorText}>
                      {errors.password.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Confirm new password"
                      placeholderTextColor={MID_GRAY}
                      secureTextEntry
                      editable={!isPending}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                  </View>
                  {errors.confirmPassword && (
                    <Text style={styles.errorText}>
                      {errors.confirmPassword.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsSection}>
            <Text style={styles.requirementsText}>
              Password must contain at least 8 characters, one uppercase, one
              lowercase, one number, and one special character.
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, isPending && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator color={OFF_WHITE} />
            ) : (
              <Text style={styles.buttonText}>RESET PASSWORD</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: MID_GRAY,
    marginTop: 8,
    letterSpacing: 1,
    lineHeight: 20,
  },
  emailText: {
    color: SIGNAL_RED,
    fontWeight: '600',
  },
  otpSection: {
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 2,
    marginBottom: 8,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    borderBottomWidth: 1,
    borderBottomColor: MID_GRAY,
  },
  textInput: {
    fontSize: 16,
    color: BLACK,
    paddingVertical: 12,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 10,
    color: SIGNAL_RED,
    marginTop: 6,
    letterSpacing: 1,
  },
  requirementsSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
  },
  requirementsText: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 1,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  button: {
    height: 56,
    backgroundColor: SIGNAL_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: LIGHT_GRAY,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 3,
  },
});

export default ResetPasswordScreen;
