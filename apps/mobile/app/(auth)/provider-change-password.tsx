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
import { useProviderChangePassword } from '@/services/user/auth.api';
import {
  TChangePassword,
  changePasswordSchema,
} from '@/validations/auth.schema';

const SIGNAL_RED = '#C44536';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

export default function ProviderChangePassword() {
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

  const { mutate: changePassword, isPending } = useProviderChangePassword();

  const onSubmit = (data: TChangePassword) => {
    changePassword(data, {
      onSuccess: () => {
        Alert.alert('SUCCESS', 'Your password has been changed successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      },
      onError: (error: any) => {
        Alert.alert(
          'ERROR',
          error.response?.data?.message ||
            'Failed to change password. Please try again.'
        );
      },
    });
  };

  return (
    <View style={styles.container}>
      <Header title="CHANGE PASSWORD" showBackButton />

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
            <Text style={styles.title}>UPDATE PASSWORD</Text>
            <Text style={styles.subtitle}>
              Enter your current password and a new password
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Controller
              control={control}
              name="oldPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>CURRENT PASSWORD</Text>
                  <View style={styles.inputRow}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={MID_GRAY}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter current password"
                      placeholderTextColor={MID_GRAY}
                      secureTextEntry
                      autoCapitalize="none"
                      editable={!isPending}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                  </View>
                  {errors.oldPassword && (
                    <Text style={styles.errorText}>
                      {errors.oldPassword.message}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                  <View style={styles.inputRow}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={MID_GRAY}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter new password"
                      placeholderTextColor={MID_GRAY}
                      secureTextEntry
                      autoCapitalize="none"
                      editable={!isPending}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                  </View>
                  {errors.newPassword && (
                    <Text style={styles.errorText}>
                      {errors.newPassword.message}
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
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={MID_GRAY}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Confirm new password"
                      placeholderTextColor={MID_GRAY}
                      secureTextEntry
                      autoCapitalize="none"
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
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isPending && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator color={OFF_WHITE} />
            ) : (
              <Text style={styles.submitButtonText}>UPDATE PASSWORD</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

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
  },
  formContainer: {
    flex: 1,
  },
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
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  submitButton: {
    height: 56,
    backgroundColor: SIGNAL_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
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
  cancelButton: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BLACK,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 3,
  },
});
