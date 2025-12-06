import { View } from 'react-native';

interface ContainerProps {
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({ children }) => {
  return <View className='flex-col'>{children}</View>;
}

export default Container;
