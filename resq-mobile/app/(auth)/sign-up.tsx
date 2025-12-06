
import SafeAreaContainer from '@/components/SafeAreaContainer';
import Button from 'components/ui/Button';
import InputBox from 'components/ui/InputBox';
import { Link, useRouter } from 'expo-router';
import { View, Image, Text } from 'react-native';

const SignupScreen: React.FC = () => {
  const router = useRouter()
  return (
    <SafeAreaContainer>
      <View className="h-full w-full flex-col items-center justify-between gap-3 border px-10 py-20">
        <View className="size-48 p-2">
          <Image
            source={require('../../assets/resq-connect-logo.png')}
            resizeMode="cover"
            className="h-full w-full"
          />
        </View>
        <View className="space-y-10">
          <Text className="text-center text-4xl">Sign In</Text>
          <Text className="text-center text-base ">
            Enter your details to login
          </Text>
        </View>

        <View className="w-full flex-col gap-4">
          <InputBox placeholder="Name" />
          <InputBox placeholder="Age" />
          <InputBox placeholder="Username" />
          <InputBox placeholder="Password" />
          <InputBox placeholder="Confirm Password" />
        </View>

        <View className="space-y-10">
          <Text className="text-center text-base ">
            Already have an account ? <Link href={"/sign-in"}>Register</Link>
          </Text>
        </View>

        <Button label={'Lets Get Started'} />
      </View>
    </SafeAreaContainer>
  );
};

export default SignupScreen;

