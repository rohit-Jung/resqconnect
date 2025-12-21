import { useState } from 'react';
import { Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputBoxProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

const InputBox: React.FC<InputBoxProps> = ({
  label,
  className,
  error,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPasswordField = secureTextEntry !== undefined;

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  return (
    <View className="w-full">
      {label && (
        <Text className="py-2" style={{ fontFamily: 'Inter' }}>
          {label}
        </Text>
      )}
      <View className="relative">
        <TextInput
          {...props}
          secureTextEntry={isPasswordField ? !isPasswordVisible : false}
          className={`rounded-2xl border p-4 ${isPasswordField ? 'pr-12' : ''} ${error ? 'border-red-500' : 'border-gray-400'}`}
          style={{ fontFamily: 'Inter' }}
          placeholderTextColor="#9CA3AF"
        />
        {isPasswordField && (
          <TouchableOpacity
            onPress={togglePasswordVisibility}
            className="absolute right-4 top-1/2 -translate-y-1/2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="mt-1 text-sm text-red-500" style={{ fontFamily: 'Inter' }}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default InputBox;
