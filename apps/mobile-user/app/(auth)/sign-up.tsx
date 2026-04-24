import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';

import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { useRegisterUser } from '@/services/user/auth.api';
import {
  TRegisterUserForm,
  UserRoles,
  userRegisterFormSchema,
} from '@/validations/auth.schema';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';
const SUCCESS_GREEN = '#10B981';

const SignupScreen: React.FC = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const insets = useSafeAreaInsets();
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    const getLocation = async () => {
      try {
        setLocationLoading(true);
        setLocationError(null);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          setLocationLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting location:', error);
        setLocationError('Failed to get location');
      } finally {
        setLocationLoading(false);
      }
    };

    getLocation();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TRegisterUserForm>({
    resolver: zodResolver(userRegisterFormSchema),
    defaultValues: {
      name: '',
      username: '',
      email: '',
      phoneNumber: '',
      age: '',
      primaryAddress: '',
      password: '',
      confirmPassword: '',
    },
  });

  const { mutate: register, isPending } = useRegisterUser();

  const onSubmit = (data: TRegisterUserForm) => {
    register(
      {
        name: data.name,
        fullName: data.name,
        username: data.username || data.email.split('@')[0],
        email: data.email,
        phoneNumber: parseInt(data.phoneNumber, 10),
        age: parseInt(data.age, 10),
        primaryAddress: data.primaryAddress,
        password: data.password,
        role: UserRoles.USER,
        termsAccepted: true,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
      },
      {
        onSuccess: () => {
          router.push('/(auth)/completing-registration');
        },
        onError: (error: any) => {
          if (!error.response) {
            Alert.alert(
              'Connection Error',
              'Unable to reach the server. Please check your internet connection and try again.'
            );
            return;
          }

          Alert.alert(
            'Error',
            error.response?.data?.message ||
              'Registration failed. Please try again.'
          );
        },
      }
    );
  };

  const InputField = ({
    label,
    name,
    placeholder,
    keyboardType = 'default',
    secureTextEntry = false,
    autoCapitalize = 'sentences',
    maxLength,
    showPasswordToggle,
  }: {
    label: string;
    name: string;
    placeholder: string;
    keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
    secureTextEntry?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    maxLength?: number;
    showPasswordToggle?: boolean;
    onTogglePassword?: () => void;
  }) => (
    <Controller
      control={control}
      name={name as keyof TRegisterUserForm}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{label}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              editable={!isPending}
              onChangeText={onChange}
              onBlur={onBlur}
              value={value ? String(value) : ''}
              placeholder={placeholder}
              placeholderTextColor={MID_GRAY}
              keyboardType={keyboardType}
              secureTextEntry={secureTextEntry && !showPasswordToggle}
              autoCapitalize={autoCapitalize}
              maxLength={maxLength}
            />
            {showPasswordToggle && (
              <TouchableOpacity
                onPress={() => {
                  if (name === 'password') {
                    setShowPassword(!showPassword);
                  } else {
                    setShowConfirmPassword(!showConfirmPassword);
                  }
                }}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={
                    (name === 'password' ? showPassword : showConfirmPassword)
                      ? 'eye-off-outline'
                      : 'eye-outline'
                  }
                  size={18}
                  color={MID_GRAY}
                />
              </TouchableOpacity>
            )}
          </View>
          {errors[name as keyof typeof errors] && (
            <Text style={styles.errorText}>
              {errors[name as keyof typeof errors]?.message as string}
            </Text>
          )}
        </View>
      )}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Pressable style={styles.container} onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
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
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
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
                <Text style={styles.tagline}>EMERGENCY RESPONSE</Text>
              </View>
            </View>

            {/* Title */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>REGISTER</Text>
              <Text style={styles.subtitle}>Create your account</Text>
            </View>

            {/* Location Status */}
            <View style={styles.locationStatus}>
              <Ionicons
                name={
                  locationLoading
                    ? 'hourglass-outline'
                    : locationError
                      ? 'warning-outline'
                      : 'location-outline'
                }
                size={16}
                color={
                  locationLoading
                    ? MID_GRAY
                    : locationError
                      ? SIGNAL_RED
                      : SUCCESS_GREEN
                }
              />
              <Text
                style={[
                  styles.locationText,
                  locationError && styles.locationError,
                  userLocation && styles.locationSuccess,
                ]}
              >
                {locationLoading
                  ? 'CAPTURING LOCATION...'
                  : locationError
                    ? 'LOCATION: UNAVAILABLE'
                    : `LOCATION: ${userLocation?.latitude.toFixed(4)}°N ${userLocation?.longitude.toFixed(4)}°E`}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <InputField
                label="FULL NAME"
                name="name"
                placeholder="Enter your full name"
                autoCapitalize="words"
              />

              <InputField
                label="USERNAME"
                name="username"
                placeholder="Choose a username"
                autoCapitalize="none"
              />

              <InputField
                label="AGE"
                name="age"
                placeholder="Your age"
                keyboardType="numeric"
                maxLength={3}
              />

              <InputField
                label="EMAIL"
                name="email"
                placeholder="name@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <InputField
                label="PHONE NUMBER"
                name="phoneNumber"
                placeholder="98XXXXXXXX"
                keyboardType="phone-pad"
                maxLength={10}
              />

              <InputField
                label="PRIMARY ADDRESS"
                name="primaryAddress"
                placeholder="Your address"
              />

              <InputField
                label="PASSWORD"
                name="password"
                placeholder="Create password"
                secureTextEntry
                autoCapitalize="none"
                showPasswordToggle={true}
              />

              <InputField
                label="CONFIRM PASSWORD"
                name="confirmPassword"
                placeholder="Confirm password"
                secureTextEntry
                autoCapitalize="none"
                showPasswordToggle={true}
              />

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
                  <Text style={styles.submitButtonText}>CREATE ACCOUNT</Text>
                )}
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>HAVE AN ACCOUNT? </Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/sign-in')}
                  disabled={isPending}
                  activeOpacity={0.7}
                >
                  <Text style={styles.footerLink}>SIGN IN</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Metadata */}
            <View style={styles.metadata}>
              <Text style={styles.metadataText}>SECURE REGISTRATION</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
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
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
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
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: LIGHT_GRAY,
    marginBottom: 24,
  },
  locationText: {
    fontSize: 10,
    color: MID_GRAY,
    marginLeft: 10,
    letterSpacing: 1,
    flex: 1,
  },
  locationError: {
    color: SIGNAL_RED,
  },
  locationSuccess: {
    color: SUCCESS_GREEN,
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
  inputWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: MID_GRAY,
  },
  inputLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: MID_GRAY,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: PRIMARY,
    paddingVertical: 10,
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
    backgroundColor: SIGNAL_RED,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    fontSize: 13,
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

export default SignupScreen;
