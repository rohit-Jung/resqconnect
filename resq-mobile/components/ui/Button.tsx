import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ label, ...props }) => {
  return (
    <TouchableOpacity
      {...props}
      className="rounded-xl border-none bg-primary px-10 py-4"
      activeOpacity={0.8}>
      <Text className="text-center text-xl text-foreground" style={{ fontFamily: 'Inter' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default Button;
