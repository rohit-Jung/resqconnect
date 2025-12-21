import SafeAreaContainer from '@/components/SafeAreaContainer';
import Button from '@/components/ui/Button';
import InputBox from '@/components/ui/InputBox';
import { useRegisterUser } from '@/services/user/auth.api';
import { userRegisterFormSchema, TRegisterUserForm, UserRoles } from '@/validations/auth.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View, Image, Text, Alert, ActivityIndicator, ScrollView } from 'react-native';

const SignupScreen: React.FC = () => {
  const router = useRouter();

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
      },
      {
        onSuccess: () => {
          // Redirect to completing registration screen
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
    <SafeAreaContainer>
      <ScrollView
        className="flex-1 bg-white"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <View className="items-center px-8 pt-8">
          {/* Logo */}
          <View className="mb-4 h-24 w-32">
            <Image
              source={require('../../assets/resq-connect-logo.png')}
              resizeMode="contain"
              className="h-full w-full"
            />
          </View>

          {/* Title */}
          <Text
            className="mb-2 text-4xl text-black"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
            Sign Up
          </Text>

          {/* Subtitle */}
          <Text
            className="mb-6 text-center text-base text-gray-600"
            style={{ fontFamily: 'Inter' }}>
            Enter your details to register
          </Text>

          {/* Form Fields */}
          <View className="mb-4 w-full gap-3">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputBox
                  placeholder="Full Name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputBox
                  placeholder="Username"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="none"
                  error={errors.username?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputBox
                  placeholder="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="phoneNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputBox
                  placeholder="Phone Number"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  error={errors.phoneNumber?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="age"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputBox
                  placeholder="Age"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="numeric"
                  error={errors.age?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="primaryAddress"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputBox
                  placeholder="Primary Address"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.primaryAddress?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputBox
                  placeholder="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <InputBox
                  placeholder="Confirm Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry
                  error={errors.confirmPassword?.message}
                />
              )}
            />
          </View>

          {/* Login Link */}
          <View className="mb-6">
            <Text className="text-center text-base text-gray-600" style={{ fontFamily: 'Inter' }}>
              Already have an account?{' '}
            </Text>
            <Link
              href="/(auth)/sign-in"
              className="mt-1 text-center font-semibold text-black underline">
              Login
            </Link>
          </View>

          {/* Submit Button */}
          <Button
            label={isPending ? 'Registering...' : "Let's Get Started"}
            onPress={handleSubmit(onSubmit)}
            disabled={isPending}
          />
          {isPending && <ActivityIndicator className="mt-4" color="#E13333" />}
        </View>
      </ScrollView>
      <View className="h-16 w-full bg-primary" />
    </SafeAreaContainer>
  );
};

export default SignupScreen;
