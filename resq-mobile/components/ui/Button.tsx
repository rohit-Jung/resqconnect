import {
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';

// import { Container } from './styles';
interface ButtonProps extends TouchableOpacityProps {
  label: string;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ label, ...props }) => {
  return (
    <TouchableOpacity
      {...props}
      className="rounded-xl border-none bg-primary px-10 py-4 
      ">
      <Text className='text-foreground text-xl' >{label}</Text>
    </TouchableOpacity>
  );
};

export default Button;
