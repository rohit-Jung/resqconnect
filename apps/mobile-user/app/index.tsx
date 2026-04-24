import { Redirect } from 'expo-router';
import React from 'react';

import { useAuthStore } from '@/store/authStore';

const Index = () => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Redirect href="/(tabs)" />;
};

export default Index;
