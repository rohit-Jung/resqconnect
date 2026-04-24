import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';

import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { TOKEN_KEY } from '@/constants';
import { useLoginUser } from '@/services/user/auth.api';
import { useAuthStore } from '@/store/authStore';
import { ILoginResponse, IOtpResponse } from '@/types/auth.types';
import { TLoginUser, loginUserSchema } from '@/validations/auth.schema';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

const isLoginResponse = (
  data: ILoginResponse | IOtpResponse
): data is ILoginResponse => {
  return 'token' in data && 'user' in data;
};

async function save(key: string, value: string) {
  await SecureStore.setItemAsync(key, value);
}

const SigninScreen: React.FC = () => {
  const router = useRouter();
  const { login: setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const insets = useSafeAreaInsets();

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

  const { mutate: loginUserMutation, isPending } = useLoginUser();

  async function loginEntity(
    role: 'user',
    responseData: any,
    data: { email: string }
  ) {
    if (isLoginResponse(responseData)) {
      const { token, user } = responseData;
      await save(TOKEN_KEY, token);
      setAuth(user, token, role);

      router.replace('/(tabs)');
    } else {
      const otpToken = responseData.otpToken;
      const userId = responseData.userId;

      router.replace({
        pathname: '/(auth)/verify-otp',
        params: {
          otpToken,
          userId,
          email: data.email,
          role,
        },
      });
    }
  }

  const onSubmit = async (data: TLoginUser) => {
    loginUserMutation(data, {
      onSuccess: async response => {
        const responseData = response.data.data;
        loginEntity('user', responseData, data);
      },
      onError: (error: any) => {
        Alert.alert(
          'Login Failed',
          error?.response?.data?.message ||
            'Invalid credentials. Please try again.'
        );
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable style={styles.container} onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.brandRow}>
                <Text style={styles.brandMark}>RESQ</Text>
                <Text style={styles.brandDot}>.</Text>
              </View>
              <View style={styles.headerLine} />
              <Text style={styles.tagline}>EMERGENCY RESPONSE</Text>
            </View>

            {/* Title */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>SIGN IN</Text>
              <Text style={styles.subtitle}>Enter your credentials</Text>
            </View>

            {/* This app is user-only */}

            {/* Form */}
            <View style={styles.formContainer}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
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
                        style={[
                          styles.input,
                          errors.email && styles.inputError,
                        ]}
                        editable={!isPending}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value || ''}
                        placeholder="name@email.com"
                        placeholderTextColor={MID_GRAY}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                    {errors.email && (
                      <Text style={styles.errorText}>
                        {errors.email.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PASSWORD</Text>
                    <View style={styles.inputRow}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color={MID_GRAY}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={[
                          styles.input,
                          errors.password && styles.inputError,
                        ]}
                        editable={!isPending}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        value={value || ''}
                        placeholder="••••••••"
                        placeholderTextColor={MID_GRAY}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                      >
                        <Ionicons
                          name={
                            showPassword ? 'eye-off-outline' : 'eye-outline'
                          }
                          size={18}
                          color={MID_GRAY}
                        />
                      </TouchableOpacity>
                    </View>
                    {errors.password && (
                      <Text style={styles.errorText}>
                        {errors.password.message}
                      </Text>
                    )}
                  </View>
                )}
              />

              {/* Forgot Password */}
              <TouchableOpacity
                style={styles.forgotPassword}
                onPress={() => router.push('/(auth)/forgot-password')}
                disabled={isPending}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>FORGOT PASSWORD?</Text>
              </TouchableOpacity>

              {/* Submit */}
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit(onSubmit)}
                disabled={isPending}
                activeOpacity={0.8}
              >
                {isPending ? (
                  <ActivityIndicator color={OFF_WHITE} />
                ) : (
                  <Text style={styles.submitButtonText}>ENTER</Text>
                )}
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>NO ACCOUNT? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/sign-up')}
                  disabled={isPending}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerLink}>REGISTER</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Metadata */}
            <View style={styles.metadata}>
              <Text style={styles.metadataText}>SECURE ACCESS</Text>
              <Text style={styles.metadataDot}>·</Text>
              <Text style={styles.metadataText}>24/7 RESPONSE</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
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
    paddingTop: 16,
  },
  header: {
    marginBottom: 32,
    marginTop: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 42,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 8,
  },
  brandDot: {
    fontSize: 42,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 50,
  },
  headerLine: {
    width: 48,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 8,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 10,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 3,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: PRIMARY,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: MID_GRAY,
    marginTop: 4,
    letterSpacing: 1,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
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
  input: {
    flex: 1,
    fontSize: 16,
    color: PRIMARY,
    paddingVertical: 12,
    fontWeight: '500',
  },
  inputError: {
    borderBottomColor: SIGNAL_RED,
  },
  eyeButton: {
    padding: 8,
  },
  errorText: {
    fontSize: 10,
    color: SIGNAL_RED,
    marginTop: 6,
    letterSpacing: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
  },
  submitButton: {
    height: 56,
    backgroundColor: SIGNAL_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 1,
  },
  footerLink: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 1,
    textDecorationLine: 'underline',
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

export default SigninScreen;
