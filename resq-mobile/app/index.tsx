import { useAuthStore } from '@/store/authStore';
import { Redirect } from 'expo-router';
import React from 'react';

const Index = () => {
  const { isAuthenticated, userType } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Redirect based on user type
  if (userType === 'service_provider') {
    return <Redirect href="/(provider)/dashboard" />;
  }

  return <Redirect href="/(tabs)" />;
};

export default Index;
