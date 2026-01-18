import React, { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, Platform, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SafeAreaContainerProps {
  children: ReactNode;
  scrollable?: boolean;
  className?: string;
  contentContainerClassName?: string;
  keyboardBehavior?: 'padding' | 'height' | 'position';
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

const SafeAreaContainer: React.FC<SafeAreaContainerProps> = ({
  children,
  scrollable = true,
  className = '',
  contentContainerClassName = '',
  keyboardBehavior,
  style,
  contentContainerStyle,
  edges = ['top', 'bottom'],
}) => {
  const behavior = keyboardBehavior || (Platform.OS === 'ios' ? 'padding' : 'height');

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: '#fff' }, style]} edges={edges}>
      <KeyboardAvoidingView behavior={behavior} style={{ flex: 1 }} className={className}>
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
    </SafeAreaView>
  );
};

export default SafeAreaContainer;
