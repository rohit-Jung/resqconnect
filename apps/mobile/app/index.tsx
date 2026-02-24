import { Redirect } from 'expo-router';
import React from 'react';

import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';

const Index = () => {
  const { isAuthenticated: userAuthenticated, userType } = useAuthStore();
  const { isAuthenticated: providerAuthenticated } = useProviderStore();

  // Check if either user or provider is authenticated
  const isAuthenticated = userAuthenticated || providerAuthenticated;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Redirect based on user type or provider authentication
  if (userType === 'service_provider' || providerAuthenticated) {
    return <Redirect href="/(provider)/dashboard" />;
  }

  return <Redirect href="/(tabs)" />;
};

export default Index;
