import InputBox from '@/components/ui/InputBox';
import SafeAreaContainer from '@/components/SafeAreaContainer';
import { useRegisterUser } from '@/services/user/auth.api';
import { userRegisterFormSchema, TRegisterUserForm, UserRoles } from '@/validations/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import {
  View,
  Text,
  Alert,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

const SignupScreen: React.FC = () => {
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Fetch user's current location on component mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        setLocationLoading(true);
        setLocationError(null);

        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission denied');
          setLocationLoading(false);
          return;
        }

        // Get current position
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
    console.log('data sending', data);
    console.log('user location', userLocation);
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
          console.log('Registration error:', error);
          Alert.alert(
            'Error',
            error.response?.data?.message || 'Registration failed. Please try again.'
          );
        },
      }
    );
  };

  return (
    <SafeAreaContainer style={styles.safeArea} contentContainerStyle={styles.scrollContent}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <FontAwesome name="arrow-left" size={24} color="#1F2937" />
      </TouchableOpacity>

      <LinearGradient colors={['#ffffff', '#F9FAFB']} style={styles.header}>
        <Image
          source={require('../../assets/resq-connect-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.headerText}>Create Account</Text>
        <Text style={styles.headerSubtext}>Sign up to get started</Text>
      </LinearGradient>

      <View style={styles.formContainer}>
        {/* Location Status Indicator */}
        <View style={styles.locationStatus}>
          <FontAwesome
            name={
              locationLoading ? 'spinner' : locationError ? 'exclamation-circle' : 'check-circle'
            }
            size={16}
            color={locationLoading ? '#6B7280' : locationError ? '#EF4444' : '#10B981'}
          />
          <Text
            style={[
              styles.locationStatusText,
              locationError && styles.locationErrorText,
              userLocation && styles.locationSuccessText,
            ]}>
            {locationLoading
              ? 'Getting your location...'
              : locationError
                ? locationError
                : `Location captured (${userLocation?.latitude.toFixed(4)}, ${userLocation?.longitude.toFixed(4)})`}
          </Text>
        </View>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputBox
              label="Full Name"
              icon="user"
              placeholder="Enter your full name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
              editable={!isPending}
            />
          )}
        />

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputBox
              label="Username"
              icon="id-badge"
              placeholder="Enter your full name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
              editable={!isPending}
            />
          )}
        />

        <Controller
          control={control}
          name="age"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputBox
              label="Age"
              icon="calendar"
              placeholder="Enter your age"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="numeric"
              error={errors.age?.message}
              editable={!isPending}
            />
          )}
        />

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
          name="phoneNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputBox
              label="Phone Number"
              icon="phone"
              placeholder="Enter phone number"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phoneNumber?.message}
              editable={!isPending}
            />
          )}
        />

        <Controller
          control={control}
          name="primaryAddress"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputBox
              label="Primary Address"
              icon="map-marker"
              placeholder="Enter your primary address"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.primaryAddress?.message}
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

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <InputBox
              label="Confirm Password"
              icon="lock"
              placeholder="Confirm password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              error={errors.confirmPassword?.message}
              editable={!isPending}
            />
          )}
        />

        <TouchableOpacity
          style={[styles.submitButton, isPending && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}>
          {isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')} disabled={isPending}>
            <Text style={styles.footerLink}>Sign In</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 20,
    zIndex: 1,
    padding: 10,
  },
  header: {
    padding: 15,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2937',
    fontFamily: 'ChauPhilomeneOne_400Regular',
  },
  headerSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  formContainer: {
    padding: 20,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  locationStatusText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  locationErrorText: {
    color: '#EF4444',
  },
  locationSuccessText: {
    color: '#10B981',
  },
  passwordRequirements: {
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  requirementText: {
    fontSize: 12,
    marginBottom: 4,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  requirementItem: {
    fontSize: 12,
    marginLeft: 8,
    marginBottom: 2,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  footerLink: {
    fontSize: 14,
    color: '#E13333',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});

export default SignupScreen;
