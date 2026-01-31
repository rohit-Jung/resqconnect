import InputBox from '@/components/ui/InputBox';
import SafeAreaContainer from '@/components/SafeAreaContainer';
import { useChangePassword } from '@/services/user/auth.api';
import { changePasswordSchema, TChangePassword } from '@/validations/auth.schema';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View, Text, Alert, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';

export default function ChangePassword() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TChangePassword>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const { mutate: changePassword, isPending } = useChangePassword();

  const onSubmit = (data: TChangePassword) => {
    changePassword(data, {
      onSuccess: () => {
        Alert.alert('Success', 'Your password has been changed successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      },
      onError: (error: any) => {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to change password. Please try again.'
        );
      },
    });
  };

  return (
    <SafeAreaContainer style={styles.safeArea} scrollable={false}>
      <View style={styles.container}>
        {/* Back Button - Fixed at top */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backArrow}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>

        {/* Centered Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Change Password</Text>
            <Text style={styles.subtitle}>Enter your current password and a new password</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Old Password */}
            <Controller
              control={control}
              name="oldPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputBox
                  icon="lock"
                  placeholder="Current Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  error={errors.oldPassword?.message}
                  editable={!isPending}
                />
              )}
            />

            {/* New Password */}
            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputBox
                  icon="lock"
                  placeholder="New Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  error={errors.newPassword?.message}
                  editable={!isPending}
                />
              )}
            />

            {/* Confirm Password */}
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputBox
                  icon="lock"
                  placeholder="Confirm New Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  autoCapitalize="none"
                  error={errors.confirmPassword?.message}
                  editable={!isPending}
                />
              )}
            />

            <TouchableOpacity
              style={[styles.button, isPending && styles.buttonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}>
              {isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Change Password</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaContainer>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  backArrow: {
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },
  content: {
    flex: 1,
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
