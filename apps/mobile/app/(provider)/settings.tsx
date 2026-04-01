import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { APP_NAME, APP_VERSION } from '@/constants';
import { useProviderStore } from '@/store/providerStore';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const BLACK = '#000000';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  iconBgColor?: string;
  iconColor?: string;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  iconBgColor = LIGHT_GRAY,
  iconColor = PRIMARY,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    style={styles.menuItem}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.menuItemLeft}>
      <View style={[styles.menuItemIcon, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.menuItemText}>
        <Text style={styles.menuItemTitle}>{title.toUpperCase()}</Text>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {onPress && <Ionicons name="chevron-forward" size={16} color={MID_GRAY} />}
  </TouchableOpacity>
);

export default function ProviderSettingsScreen() {
  const router = useRouter();
  const { provider, logout } = useProviderStore();

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Text style={styles.brandMark}>RESQ</Text>
          <Text style={styles.brandDot}>.</Text>
        </View>
        <View style={styles.headerLine} />
        <Text style={styles.tagline}>RESPONDER SETTINGS</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
            <View style={styles.sectionLine} />
          </View>

          <SettingsItem
            icon="person-outline"
            title="Profile"
            subtitle={provider?.name || 'View and edit your profile'}
            onPress={() => router.push('/(provider)/profile')}
            iconBgColor="#FEE2E2"
            iconColor={SIGNAL_RED}
          />

          <SettingsItem
            icon="lock-closed-outline"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => router.push('/(auth)/provider-change-password')}
            iconBgColor="#DBEAFE"
            iconColor="#3B82F6"
          />
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
            <View style={styles.sectionLine} />
          </View>

          <SettingsItem
            icon="notifications-outline"
            title="Notification Settings"
            subtitle="Configure how you receive alerts"
            onPress={() => router.push('/notification-settings')}
            iconBgColor="#FEF3C7"
            iconColor="#F59E0B"
          />
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>HELP & SUPPORT</Text>
            <View style={styles.sectionLine} />
          </View>

          <SettingsItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help with the app"
            onPress={() => router.push('/help-support')}
            iconBgColor="#D1FAE5"
            iconColor="#10B981"
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>ABOUT</Text>
            <View style={styles.sectionLine} />
          </View>

          <SettingsItem
            icon="document-text-outline"
            title="Terms of Service"
            onPress={() => router.push('/terms-of-service')}
          />

          <SettingsItem
            icon="shield-outline"
            title="Privacy Policy"
            onPress={() => router.push('/privacy-policy')}
          />
        </View>

        {/* Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>{APP_NAME}</Text>
          <Text style={styles.versionDot}>·</Text>
          <Text style={styles.versionText}>VERSION {APP_VERSION}</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={SIGNAL_RED} />
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>
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
  brandMark: {
    fontSize: 28,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandDot: {
    fontSize: 28,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 34,
  },
  headerLine: {
    width: 36,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 6,
    marginBottom: 6,
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
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: LIGHT_GRAY,
    marginLeft: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: BLACK,
    letterSpacing: 1,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 0.5,
  },
  versionSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
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
});
