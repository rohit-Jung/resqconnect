import { Ionicons } from '@expo/vector-icons';

import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { SocketEvents } from '@/constants/socket.constants';
import { useGetDocumentStatus } from '@/services/document/document.api';
import { socketManager } from '@/socket/socket-manager';
import { useProviderStore } from '@/store/providerStore';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';

const ProviderLayout: React.FC = () => {
  const router = useRouter();

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { provider, isLoading: isStoreLoading } = useProviderStore();
  const { data, isLoading: isApiLoading, isError } = useGetDocumentStatus(true);

  const isLoading = isStoreLoading || isApiLoading;

  useEffect(() => {
    if (isLoading || isError || !data?.data?.data) return;
    if (!provider) return;

    const documentStatus = data.data.data.documentStatus;
    if (documentStatus !== 'approved') {
      if (documentStatus === 'not_submitted') {
        router.replace('/(auth)/upload-documents');
      } else {
        router.replace('/(auth)/verification-pending');
      }
    }
  }, [data, isLoading, isError, provider, router]);

  // Emit PROVIDER_CONNECT to tell backend this socket belongs to a provider
  // This allows backend to send NEW_EMERGENCY events to provider:providerId room
  useEffect(() => {
    if (!provider) return;

    const socket = socketManager.getSocket();
    if (!socket?.connected) return;

    console.log(
      `[PROVIDER] Emitting PROVIDER_CONNECT for provider ${provider.id}`
    );
    socketManager.emit(SocketEvents.PROVIDER_CONNECT, {
      providerId: provider.id,
    });
  }, [provider]);

  // TODO: constantly update the provider location here
  useEffect(() => {
    async function getCurrentLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    }

    getCurrentLocation();
  }, []);

  if (isLoading || !provider) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: OFF_WHITE,
        }}
      >
        <ActivityIndicator size="large" color={SIGNAL_RED} />
      </View>
    );
  }

  if (isError || !data?.data?.data) {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: SIGNAL_RED,
          tabBarInactiveTintColor: MID_GRAY,
          tabBarStyle: {
            backgroundColor: OFF_WHITE,
            borderTopWidth: 1,
            borderTopColor: LIGHT_GRAY,
            height: 85,
            paddingRight: 10,
            paddingLeft: 10,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: 1,
          },
        }}
      >
        <Tabs.Screen name="dashboard" />
        <Tabs.Screen name="history" />
        <Tabs.Screen name="settings" />
        <Tabs.Screen name="profile" />
      </Tabs>
    );
  }

  const documentStatus = data.data.data.documentStatus;
  if (documentStatus !== 'approved') {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: OFF_WHITE,
        }}
      >
        <ActivityIndicator size="large" color={SIGNAL_RED} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: SIGNAL_RED,
        tabBarInactiveTintColor: MID_GRAY,
        tabBarStyle: {
          backgroundColor: OFF_WHITE,
          borderTopWidth: 1,
          borderTopColor: LIGHT_GRAY,
          height: 85,
          paddingRight: 10,
          paddingLeft: 10,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'HOME',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'HISTORY',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'SETTINGS',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'settings' : 'settings-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'PROFILE',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default ProviderLayout;
