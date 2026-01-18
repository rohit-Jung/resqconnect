import InputBox from '@/components/ui/InputBox';
import SafeAreaContainer from '@/components/SafeAreaContainer';
import { useLoginUser, useLoginServiceProvider } from '@/services/user/auth.api';
import { useAuthStore } from '@/store/authStore';
import { ILoginResponse, IOtpResponse } from '@/types/auth.types';
import { loginUserSchema, TLoginUser } from '@/validations/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY } from '@/constants';
import { LinearGradient } from 'expo-linear-gradient';

const isLoginResponse = (data: ILoginResponse | IOtpResponse): data is ILoginResponse => {
  return 'token' in data && 'user' in data;
};

async function save(key: string, value: string) {
  await SecureStore.setItemAsync(key, value);
}

const SigninScreen: React.FC = () => {
  const router = useRouter();
  const { login: setAuth } = useAuthStore();
  const [isServiceProvider, setIsServiceProvider] = useState(false);

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

  const { mutate: loginUserMutation, isPending: isUserPending } = useLoginUser();
  const { mutate: loginServiceProviderMutation, isPending: isServiceProviderPending } =
    useLoginServiceProvider();

  const isPending = isUserPending || isServiceProviderPending;

  const onSubmit = (data: TLoginUser) => {
    if (isServiceProvider) {
      loginServiceProviderMutation(data, {
        onSuccess: (response) => {
          const { token, user } = response.data.data;
          console.log('Service Provider Login successful:', { user, token });
          setAuth(user, token);
          save(TOKEN_KEY, token);
          router.replace('/(tabs)');
        },
        onError: (error: any) => {
          Alert.alert(
            'Error',
            error.response?.data?.message || 'Login failed. Please check your credentials.'
          );
        },
      });
    } else {
      loginUserMutation(data, {
        onSuccess: (response) => {
          const responseData = response.data.data;

          if (isLoginResponse(responseData)) {
            const { token, user } = responseData;
            console.log('Login successful:', { user, token });
            setAuth(user, token);
            save(TOKEN_KEY, token);
            router.replace('/(tabs)');
          } else {
            const { otpToken, userId } = responseData;
            console.log('Redirecting to OTP with:', {
              otpToken,
              userId,
              email: data.email,
            });
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
    }
  };

  return (
    <SafeAreaContainer style={styles.safeArea} contentContainerStyle={styles.scrollContent}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Header */}
      <LinearGradient colors={['#ffffff', '#F9FAFB']} style={styles.header}>
        <Image
          source={require('../../assets/resq-connect-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>Welcome Back</Text>
        <Text style={styles.headerSubtitle}>Sign in to continue</Text>
      </LinearGradient>

      {/* Form */}
      <View style={styles.formContainer}>
        {/* Toggle User/Service Provider */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, !isServiceProvider && styles.toggleButtonActive]}
            onPress={() => setIsServiceProvider(false)}
            disabled={isPending}>
            <Text style={[styles.toggleText, !isServiceProvider && styles.toggleTextActive]}>
              User
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, isServiceProvider && styles.toggleButtonActive]}
            onPress={() => setIsServiceProvider(true)}
            disabled={isPending}>
            <Text style={[styles.toggleText, isServiceProvider && styles.toggleTextActive]}>
              Service Provider
            </Text>
          </TouchableOpacity>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputBox
              label="Email"
              icon="envelope"
              placeholder="Enter your email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
              editable={!isPending}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputBox
              label="Password"
              icon="lock"
              placeholder="Enter password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={errors.password?.message}
              editable={!isPending}
            />
          )}
        />

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => router.push('/(auth)/forgot-password')}
          disabled={isPending}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Only show Sign Up for Users */}
        {!isServiceProvider && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')} disabled={isPending}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    fontFamily: 'ChauPhilomeneOne_400Regular',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#E13333',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E13333',
    fontFamily: 'Inter',
  },
  submitButton: {
    height: 52,
    backgroundColor: '#E13333',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E13333',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E13333',
    fontFamily: 'Inter',
  },
});

export default SigninScreen;
