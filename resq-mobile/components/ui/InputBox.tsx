import { Text, TextInput, TextInputProps, View } from 'react-native';

// import { Container } from './styles';
interface InputBoxProps extends TextInputProps {
  label?: string;
  placeholder?: string;
  className?: string;
}

const InputBox: React.FC<InputBoxProps> = ({ label, className, ...props }) => {
  return (
    <View className='w-full'>
      {label && <Text className="py-2">{label}</Text>}
      <TextInput {...props} className="rounded-2xl border border-gray-500 p-4" />
    </View>
  );
};

export default InputBox;
