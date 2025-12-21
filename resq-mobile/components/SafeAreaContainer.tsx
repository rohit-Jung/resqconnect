import React, { ReactNode } from 'react';
import {
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ViewStyle,
} from 'react-native';

interface SafeAreaContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  className?: string;
  contentContainerClassName?: string;
  keyboardBehavior?: 'padding' | 'height' | 'position';
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({
  children,
  scrollable = true,
  className = '',
  contentContainerClassName = '',
  keyboardBehavior,
  style,
  contentContainerStyle,
}) => {
  const behavior =
    keyboardBehavior || (Platform.OS === 'ios' ? 'padding' : 'height');

  return (
    <KeyboardAvoidingView
      behavior={behavior}
      className={`flex-1 ${className} mt-16`}
      style={style}>
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
          className={contentContainerClassName}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <>{children}</>
      )}
    </KeyboardAvoidingView>
  );
};

export default SafeAreaContainer;
