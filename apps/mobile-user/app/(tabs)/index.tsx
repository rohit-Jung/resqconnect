import { Ionicons } from '@expo/vector-icons';

import { Redirect, useRouter } from 'expo-router';
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { EMERGENCY_PHONE_NUMBER } from '@/constants';
import { useAuthStore } from '@/store/authStore';

const SIGNAL_RED = '#C44536';
const SOS_RED = '#E63319';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      `This will dial the emergency number (${EMERGENCY_PHONE_NUMBER}). Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Now',
          style: 'destructive',
          onPress: () => {
            Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header - Swiss style */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>RESQ</Text>
            <Text style={styles.brandDot}>.</Text>
          </View>
          <TouchableOpacity onPress={logout} activeOpacity={0.7}>
            <View style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={22} color={OFF_WHITE} />
            </View>
          </TouchableOpacity>
        </View>
        <Text style={styles.greeting}>
          Hello, {user?.name?.split(' ')[0] || 'User'}
        </Text>
        <View style={styles.headerLine} />
        <Text style={styles.tagline}>EMERGENCY RESPONSE</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SOS Button - Large and centered */}
        <View style={styles.sosSection}>
          <TouchableOpacity
            style={styles.sosButton}
            activeOpacity={0.8}
            onPress={() => router.push('/emergency-request')}
          >
            <View style={styles.sosInner}>
              <Ionicons name="warning-outline" size={70} color={OFF_WHITE} />
            </View>
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
          <Text style={styles.sosLabel}>TAP FOR EMERGENCY</Text>
        </View>

        {/* Section Divider */}
        <View style={styles.sectionDivider}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.sectionLine} />
        </View>

        {/* Quick Actions - 2x2 Grid */}
        <View style={styles.quickActions}>
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/share-location')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="location" size={28} color={OFF_WHITE} />
              </View>
              <Text style={styles.quickLabel}>SHARE</Text>
              <Text style={styles.quickSubLabel}>LOCATION</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/emergency-contacts')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#3B82F6' }]}>
                <Ionicons name="people" size={28} color={OFF_WHITE} />
              </View>
              <Text style={styles.quickLabel}>CONTACTS</Text>
              <Text style={styles.quickSubLabel}>EMERGENCY</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/first-aid')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: SIGNAL_RED }]}>
                <Ionicons name="medkit" size={28} color={OFF_WHITE} />
              </View>
              <Text style={styles.quickLabel}>FIRST AID</Text>
              <Text style={styles.quickSubLabel}>GUIDE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={handleEmergencyCall}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#059669' }]}>
                <Ionicons name="call" size={28} color={OFF_WHITE} />
              </View>
              <Text style={styles.quickLabel}>CALL</Text>
              <Text style={styles.quickSubLabel}>EMERGENCY</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statusTitle}>ALL CLEAR</Text>
          </View>
          <View style={styles.statusDivider} />
          <Text style={styles.statusText}>
            No active emergencies in your area.
          </Text>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
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
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  logoutButton: {
    padding: 10,
    backgroundColor: SIGNAL_RED,
  },
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
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 1,
    marginTop: 16,
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
    paddingTop: 32,
    paddingBottom: 20,
  },
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: LIGHT_GRAY,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 2,
    marginHorizontal: 16,
  },
  sosSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  sosButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  sosInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: SIGNAL_RED,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    fontSize: 28,
    fontWeight: '900',
    color: SIGNAL_RED,
    letterSpacing: 4,
    marginTop: 12,
  },
  sosLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  quickRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
    paddingVertical: 20,
    backgroundColor: OFF_WHITE,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
  },
  quickIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 1,
    textAlign: 'center',
  },
  quickSubLabel: {
    fontSize: 9,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: 2,
  },
  statusCard: {
    marginHorizontal: 24,
    padding: 20,
    backgroundColor: OFF_WHITE,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 2,
  },
  statusDivider: {
    height: 1,
    backgroundColor: LIGHT_GRAY,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});
