import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import {
  ProfileInfoCard,
  ProfileInfoItem,
  ProfileScreenContent,
} from '@/components/ProfileScreen';
import { useProviderStore } from '@/store/providerStore';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  ambulance: '🚑 Ambulance',
  police: '🚔 Police',
  fire_truck: '🚒 Fire Truck',
  rescue_team: '🆘 Rescue Team',
};

export default function ProviderProfileScreen() {
  const { provider, isAuthenticated, logout, isLoading, updateProfilePicture } =
    useProviderStore();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#E63946" />
      </View>
    );
  }

  if (!isAuthenticated || !provider) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const profileInfoItems: ProfileInfoItem[] = [
    {
      icon: 'person-outline',
      label: 'Name',
      value: provider?.name || 'N/A',
    },
    {
      icon: 'mail-outline',
      label: 'Email',
      value: provider?.email || 'N/A',
    },
    {
      icon: 'call-outline',
      label: 'Phone Number',
      value: provider?.phoneNumber?.toString() || 'Not set',
    },
    {
      icon: 'medkit-outline',
      label: 'Service Type',
      value: provider?.serviceType
        ? SERVICE_TYPE_LABELS[provider.serviceType] || provider.serviceType
        : 'N/A',
    },
    {
      icon: 'location-outline',
      label: 'Primary Address',
      value: provider?.primaryAddress || 'Not set',
    },
  ];

  // Provider-specific vehicle information section
  const VehicleInfoSection = provider?.vehicleInformation ? (
    <View className="mt-6 px-6">
      <Text
        className="mb-4 text-lg text-gray-800"
        style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
      >
        Vehicle Information
      </Text>
      <ProfileInfoCard
        icon="car-outline"
        label="Vehicle Type"
        value={provider.vehicleInformation.type || 'N/A'}
      />
      <ProfileInfoCard
        icon="document-text-outline"
        label="Vehicle Number"
        value={provider.vehicleInformation.number || 'N/A'}
      />
      <ProfileInfoCard
        icon="speedometer-outline"
        label="Model"
        value={provider.vehicleInformation.model || 'N/A'}
      />
      <ProfileInfoCard
        icon="color-palette-outline"
        label="Color"
        value={provider.vehicleInformation.color || 'N/A'}
      />
    </View>
  ) : null;

  const handleProfilePictureChange = (newUrl: string | null) => {
    updateProfilePicture(newUrl);
  };

  return (
    <ProfileScreenContent
      name={provider?.name || 'Provider'}
      email={provider?.email || ''}
      role="service_provider"
      profilePicture={provider?.profilePicture}
      profileInfoItems={profileInfoItems}
      additionalSections={VehicleInfoSection}
      onLogout={logout}
      onProfilePictureChange={handleProfilePictureChange}
      editProfileRoute="/edit-provider-profile"
      changePasswordRoute="/(auth)/provider-change-password"
    />
  );
}
