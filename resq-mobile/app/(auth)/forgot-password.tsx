import InputBox from '@/components/ui/InputBox';
import SafeAreaContainer from '@/components/SafeAreaContainer';
import { useForgotPassword } from '@/services/user/auth.api';
import {
  forgotPasswordSchema,
  TForgotPassword,
} from '@/validations/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

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
        Alert.alert(
          'Success',
          'Password reset instructions have been sent to your email address.',
          [{ text: 'OK' }],
        );
        router.push({
          pathname: '/(auth)/reset-password',
          params: { userId, email: data.email },
        });
      },
      onError: (error: any) => {
        Alert.alert(
          'Error',
          error.response?.data?.message ||
            'Failed to send OTP. Please try again.',
        );
      },
    });
  };

  return (
    <SafeAreaContainer style={styles.safeArea} scrollable={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your linked email to reset your password
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <InputBox
                icon="envelope"
                placeholder="Email"
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

          {errors.email && (
            <View style={styles.errorContainer}>
              <FontAwesome
                name="exclamation-circle"
                size={16}
                color="#EF4444"
              />
              <Text style={styles.errorText}>{errors.email.message}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isPending && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}>
            {isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaContainer>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1F2937',
    fontFamily: 'ChauPhilomeneOne_400Regular',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  form: {
    gap: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#EF4444',
    fontFamily: 'Inter',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#E13333',
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
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  backButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E13333',
    fontFamily: 'Inter',
  },
});

export default ForgotPasswordScreen;
