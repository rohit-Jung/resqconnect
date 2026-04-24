import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useChangePassword } from '@/services/user/auth.api';
import {
  TChangePassword,
  changePasswordSchema,
} from '@/validations/auth.schema';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

export default function ChangePassword() {
  const router = useRouter();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          error.response?.data?.message ||
            'Failed to change password. Please try again.'
        );
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable style={styles.container} onPress={Keyboard.dismiss}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={OFF_WHITE} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <View style={styles.brandRow}>
              <Text style={styles.brandMark}>RESQ</Text>
              <Text style={styles.brandDot}>.</Text>
            </View>
            <View style={styles.headerLine} />
            <Text style={styles.tagline}>Change Password</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>UPDATE PASSWORD</Text>
            <Text style={styles.subtitle}>
              Enter your current password and a new password
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {/* Old Password */}
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
                      secureTextEntry={!showOldPassword}
                      autoCapitalize="none"
                      editable={!isPending}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                    <TouchableOpacity
                      onPress={() => setShowOldPassword(!showOldPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={
                          showOldPassword ? 'eye-off-outline' : 'eye-outline'
                        }
                        size={18}
                        color={MID_GRAY}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.oldPassword && (
                    <Text style={styles.errorText}>
                      {errors.oldPassword.message}
                    </Text>
                  )}
                </View>
              )}
            />

            {/* New Password */}
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
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      editable={!isPending}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={
                          showNewPassword ? 'eye-off-outline' : 'eye-outline'
                        }
                        size={18}
                        color={MID_GRAY}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.newPassword && (
                    <Text style={styles.errorText}>
                      {errors.newPassword.message}
                    </Text>
                  )}
                </View>
              )}
            />

            {/* Confirm Password */}
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
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      editable={!isPending}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? 'eye-off-outline'
                            : 'eye-outline'
                        }
                        size={18}
                        color={MID_GRAY}
                      />
                    </TouchableOpacity>
                  </View>
                  {errors.confirmPassword && (
                    <Text style={styles.errorText}>
                      {errors.confirmPassword.message}
                    </Text>
                  )}
                </View>
              )}
            />

            {/* Submit */}
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

            {/* Cancel */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>CANCEL</Text>
            </TouchableOpacity>
          </View>

          {/* Metadata */}
          <View style={styles.metadata}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={MID_GRAY}
            />
            <Text style={styles.metadataText}>SECURE UPDATE</Text>
          </View>
        </ScrollView>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  backButton: {
    padding: 10,
    backgroundColor: SIGNAL_RED,
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 22,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 22,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 26,
  },
  headerLine: {
    width: 36,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: PRIMARY,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 12,
    color: MID_GRAY,
    marginTop: 8,
    letterSpacing: 0.5,
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
    color: PRIMARY,
    paddingVertical: 12,
    fontWeight: '500',
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
  submitButton: {
    height: 56,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.7,
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
    marginTop: 12,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 3,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    marginTop: 'auto',
    paddingBottom: 40,
  },
  metadataText: {
    fontSize: 10,
    color: MID_GRAY,
    letterSpacing: 2,
    marginLeft: 8,
  },
});
