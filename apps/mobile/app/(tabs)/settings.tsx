import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { APP_NAME, APP_VERSION, SMS_FALLBACK_NUMBER } from '@/constants';
import { EmergencySettings, userApi } from '@/services/user/user.api';
import { useAuthStore } from '@/store/authStore';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

const NOTIFICATION_METHODS = [
  { value: 'sms', label: 'SMS Only', icon: 'chatbubble-outline' as const },
  {
    value: 'push',
    label: 'App Notification',
    icon: 'notifications-outline' as const,
  },
  { value: 'both', label: 'Both', icon: 'apps-outline' as const },
];

export default function SettingsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { logout } = useAuthStore();
  const [localSettings, setLocalSettings] = useState<EmergencySettings>({
    notifyEmergencyContacts: true,
    emergencyNotificationMethod: 'both',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['emergencySettings'],
    queryFn: userApi.getEmergencySettings,
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EmergencySettings>) =>
      userApi.updateEmergencySettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencySettings'] });
      Alert.alert('Success', 'Settings updated successfully');
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to update settings'
      );
      if (settings) {
        setLocalSettings(settings);
      }
    },
  });

  const handleToggleNotify = () => {
    const newValue = !localSettings.notifyEmergencyContacts;
    setLocalSettings({ ...localSettings, notifyEmergencyContacts: newValue });
    updateMutation.mutate({ notifyEmergencyContacts: newValue });
  };

  const handleMethodChange = (method: 'sms' | 'push' | 'both') => {
    setLocalSettings({ ...localSettings, emergencyNotificationMethod: method });
    updateMutation.mutate({ emergencyNotificationMethod: method });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header - Swiss style */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>RESQ</Text>
            <Text style={styles.brandDot}>.</Text>
          </View>
          <View style={styles.headerLine} />
          <Text style={styles.tagline}>SETTINGS</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergency Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="warning-outline" size={18} color={SIGNAL_RED} />
            </View>
            <Text style={styles.sectionTitle}>EMERGENCY NOTIFICATIONS</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator color={SIGNAL_RED} />
          ) : (
            <View style={styles.sectionContent}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleInfo}>
                  <Text style={styles.toggleLabel}>
                    NOTIFY EMERGENCY CONTACTS
                  </Text>
                  <Text style={styles.toggleDescription}>
                    Alert your emergency contacts when you request help
                  </Text>
                </View>
                <Switch
                  value={localSettings.notifyEmergencyContacts}
                  onValueChange={handleToggleNotify}
                  trackColor={{ false: LIGHT_GRAY, true: SIGNAL_RED }}
                  thumbColor={OFF_WHITE}
                  disabled={updateMutation.isPending}
                />
              </View>

              {localSettings.notifyEmergencyContacts && (
                <View style={styles.methodSection}>
                  <Text style={styles.methodLabel}>HOW TO NOTIFY:</Text>
                  {NOTIFICATION_METHODS.map(method => (
                    <TouchableOpacity
                      key={method.value}
                      style={[
                        styles.methodOption,
                        localSettings.emergencyNotificationMethod ===
                          method.value && styles.methodOptionActive,
                      ]}
                      onPress={() =>
                        handleMethodChange(
                          method.value as 'sms' | 'push' | 'both'
                        )
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={method.icon}
                        size={18}
                        color={
                          localSettings.emergencyNotificationMethod ===
                          method.value
                            ? SIGNAL_RED
                            : MID_GRAY
                        }
                      />
                      <Text
                        style={[
                          styles.methodText,
                          localSettings.emergencyNotificationMethod ===
                            method.value && styles.methodTextActive,
                        ]}
                      >
                        {method.label.toUpperCase()}
                      </Text>
                      {localSettings.emergencyNotificationMethod ===
                        method.value && (
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color={SIGNAL_RED}
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Offline SMS Fallback */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons
                name="cloud-offline-outline"
                size={18}
                color="#D97706"
              />
            </View>
            <Text style={styles.sectionTitle}>OFFLINE SMS FALLBACK</Text>
          </View>

          <View style={styles.sectionContent}>
            <Text style={styles.descriptionText}>
              When you're offline, you can still request emergency help via SMS.
              The message will be sent to our emergency SMS gateway.
            </Text>

            <View style={styles.smsInfo}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#D97706"
              />
              <Text style={styles.smsInfoText}>
                SMS GATEWAY: {SMS_FALLBACK_NUMBER}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => router.push('/sms-emergency')}
              activeOpacity={0.7}
            >
              <View style={styles.linkLeft}>
                <Ionicons name="send-outline" size={18} color={MID_GRAY} />
                <Text style={styles.linkText}>TEST SMS EMERGENCY</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={MID_GRAY} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: LIGHT_GRAY }]}>
              <Ionicons name="link-outline" size={18} color={PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>QUICK LINKS</Text>
          </View>

          <View style={styles.sectionContent}>
            {[
              {
                icon: 'people-outline',
                text: 'MANAGE EMERGENCY CONTACTS',
                route: '/(tabs)/emergency-contacts',
              },
              {
                icon: 'person-outline',
                text: 'EDIT PROFILE',
                route: '/(tabs)/profile',
              },
              {
                icon: 'lock-closed-outline',
                text: 'CHANGE PASSWORD',
                route: '/(auth)/change-password',
              },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.linkRow}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.linkLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={MID_GRAY}
                  />
                  <Text style={styles.linkText}>{item.text}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={MID_GRAY} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: LIGHT_GRAY }]}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={PRIMARY}
              />
            </View>
            <Text style={styles.sectionTitle}>ABOUT</Text>
          </View>

          <View style={styles.sectionContent}>
            {[
              {
                icon: 'help-circle-outline',
                text: 'HELP & SUPPORT',
                route: '/help-support',
              },
              {
                icon: 'document-text-outline',
                text: 'TERMS OF SERVICE',
                route: '/terms-of-service',
              },
              {
                icon: 'shield-outline',
                text: 'PRIVACY POLICY',
                route: '/privacy-policy',
              },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.linkRow}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View style={styles.linkLeft}>
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={MID_GRAY}
                  />
                  <Text style={styles.linkText}>{item.text}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={MID_GRAY} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={SIGNAL_RED} />
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{APP_NAME}</Text>
          <Text style={styles.versionDot}>·</Text>
          <Text style={styles.versionText}>VERSION {APP_VERSION}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  header: {
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  headerContent: {},
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 28,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 28,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 34,
  },
  headerLine: {
    width: 48,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 8,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  sectionContent: {
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    padding: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 1,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 0.5,
  },
  methodSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
  },
  methodLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
    marginBottom: 12,
  },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  methodOptionActive: {},
  methodText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
    marginLeft: 12,
  },
  methodTextActive: {
    color: SIGNAL_RED,
  },
  descriptionText: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 0.5,
    lineHeight: 18,
    marginBottom: 16,
  },
  smsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    marginBottom: 16,
  },
  smsInfoText: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
    letterSpacing: 1,
    marginLeft: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 11,
    fontWeight: '600',
    color: PRIMARY,
    letterSpacing: 1,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: SIGNAL_RED,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: SIGNAL_RED,
    letterSpacing: 2,
    marginLeft: 8,
  },
  versionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  versionText: {
    fontSize: 9,
    color: MID_GRAY,
    letterSpacing: 2,
  },
  versionDot: {
    fontSize: 9,
    color: SIGNAL_RED,
    marginHorizontal: 8,
  },
});
