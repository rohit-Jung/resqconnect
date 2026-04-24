import { Redirect } from 'expo-router';
import React from 'react';

import { useProviderStore } from '@/store/providerStore';

const Index = () => {
  const { isAuthenticated, siloBaseUrl } = useProviderStore();

  if (!isAuthenticated) {
    if (!siloBaseUrl) {
      return <Redirect href="/(auth)/select-organization" />;
    }
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Redirect href="/(provider)/dashboard" />;
};

export default Index;
