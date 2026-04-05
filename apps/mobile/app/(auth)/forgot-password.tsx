import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';

import { useRouter } from 'expo-router';
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
import { useForgotPassword } from '@/services/user/auth.api';
import {
  TForgotPassword,
  forgotPasswordSchema,
} from '@/validations/auth.schema';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

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
      onSuccess: response => {
        const userId = response.data?.data.userId;
        Alert.alert(
          'SUCCESS',
          'Password reset instructions have been sent to your email address.',
          [
            {
              text: 'OK',
              onPress: () =>
                router.push({
                  pathname: '/(auth)/reset-password',
                  params: { userId, email: data.email },
                }),
            },
          ]
        );
      },
      onError: (error: any) => {
        Alert.alert(
          'ERROR',
          error.response?.data?.message ||
            'Failed to send OTP. Please try again.'
        );
      },
    });
  };

  return (
    <View style={styles.container}>
      <Header title="PASSWORD RECOVERY" showBackButton />

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
            <Text style={styles.title}>FORGOT PASSWORD</Text>
            <Text style={styles.subtitle}>
              Enter your linked email to reset your password
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={MID_GRAY}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@email.com"
                  placeholderTextColor={MID_GRAY}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isPending}
                  {...control.register('email')}
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, isPending && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
              activeOpacity={0.8}
            >
              {isPending ? (
                <ActivityIndicator color={OFF_WHITE} />
              ) : (
                <Text style={styles.buttonText}>SEND OTP</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>BACK TO LOGIN</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    paddingBottom: 40,
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
  },
  formContainer: {},
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 2,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: MID_GRAY,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
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
  button: {
    height: 56,
    backgroundColor: SIGNAL_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  backButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BLACK,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 2,
  },
});

export default ForgotPasswordScreen;
