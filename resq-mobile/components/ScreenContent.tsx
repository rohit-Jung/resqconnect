import React from 'react';
import { Text, View } from 'react-native';

import { EditScreenInfo } from './EditScreenInfo';
import LoginScreen from './auth/LoginScreen';
import SafeAreaContainer from './SafeAreaContainer';

type ScreenContentProps = {
  title: string;
  path: string;
  children?: React.ReactNode;
};

export const ScreenContent = ({
  title,
  path,
  children,
}: ScreenContentProps) => {
  return (
    <SafeAreaContainer>
      <LoginScreen />
      {children}
    </SafeAreaContainer>
  );
};
const styles = {
  container: `items-center flex-1 justify- bg-white`,
  separator: `h-[1px] my-7 w-4/5 bg-gray-200`,
  title: `text-xl font-bold`,
};
