import SafeAreaContainer from '@/components/SafeAreaContainer';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CompletingRegistrationScreen: React.FC = () => {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    // Show "Completing" for 2 seconds, then show "Completed"
    const completingTimer = setTimeout(() => {
      setIsCompleted(true);
    }, 2000);

    // Redirect to sign-in after 4 seconds total
    const redirectTimer = setTimeout(() => {
      router.replace('/(auth)/sign-in');
    }, 4000);

    return () => {
      clearTimeout(completingTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <SafeAreaContainer scrollable={false}>
      <View className="flex-1 items-center justify-center bg-white px-8">
        <View className="mb-8 h-48 w-56">
          <Image
            source={require('../../assets/resq-connect-logo.png')}
            resizeMode="contain"
            className="h-full w-full"
          />
        </View>

        {isCompleted ? (
          <>
            {/* Completed State */}
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-green-500">
              <Ionicons name="checkmark" size={48} color="white" />
            </View>
            <Text
              className="mb-2 text-center text-4xl text-black"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
              Registration
            </Text>
            <Text
              className="mb-8 text-center text-4xl text-green-500"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
              Completed!
            </Text>
            <Text className="text-center text-base text-gray-600" style={{ fontFamily: 'Inter' }}>
              Redirecting to login...
            </Text>
          </>
        ) : (
          <>
            {/* Completing State */}
            <Text
              className="mb-2 text-center text-4xl text-black"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
              Completing
            </Text>
            <Text
              className="mb-8 text-center text-4xl text-black"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}>
              Registration
            </Text>
            <Text className="text-center text-base text-gray-600" style={{ fontFamily: 'Inter' }}>
              Please wait while we set up{'\n'}your account...
            </Text>
          </>
        )}
      </View>
    </SafeAreaContainer>
  );
};

export default CompletingRegistrationScreen;
