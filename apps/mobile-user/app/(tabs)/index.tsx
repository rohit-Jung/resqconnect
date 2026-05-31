import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import * as Location from 'expo-location';
import { Redirect, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EMERGENCY_PHONE_NUMBER } from '@/constants';
import { useCreateEmergencyRequest } from '@/services/emergency/emergency.api';
import { useAuthStore } from '@/store/authStore';
import { TEmergencyType } from '@/validations/emergency.schema';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

interface ServiceType {
  type: TEmergencyType;
  label: string;
  sublabel: string;
  icon: string;
  color: string;
}

const SERVICE_TYPES: ServiceType[] = [
  {
    type: 'ambulance',
    label: 'MEDICAL',
    sublabel: 'AMBULANCE',
    icon: 'ambulance',
    color: SIGNAL_RED,
  },
  {
    type: 'police',
    label: 'POLICE',
    sublabel: 'SECURITY',
    icon: 'shield-account',
    color: '#3B82F6',
  },
  {
    type: 'fire_truck',
    label: 'FIRE',
    sublabel: 'BRIGADE',
    icon: 'fire-truck',
    color: '#F97316',
  },
  {
    type: 'rescue_team',
    label: 'RESCUE',
    sublabel: 'TEAM',
    icon: 'lifebuoy',
    color: '#10B981',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { mutate: createEmergency } = useCreateEmergencyRequest();

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationReady, setLocationReady] = useState(false);
  const [pendingType, setPendingType] = useState<TEmergencyType | null>(null);

  const locationRef = useRef<{ latitude: number; longitude: number } | null>(
    null
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      setLocation(coords);
      locationRef.current = coords;
      setLocationReady(true);
    })();
  }, []);

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
          onPress: () => Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`),
        },
      ]
    );
  };

  const handleOneTap = (service: ServiceType) => {
    if (!locationReady || !locationRef.current) {
      Alert.alert(
        'Getting Location',
        'Your location is still being fetched. Please wait a moment.'
      );
      return;
    }

    const coords = locationRef.current;

    Alert.alert(
      `Send ${service.label} Emergency?`,
      'Your current location will be shared with emergency responders immediately.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setPendingType(null),
        },
        {
          text: 'SEND NOW',
          style: 'destructive',
          onPress: () => {
            setPendingType(service.type);
            createEmergency(
              {
                emergencyType: service.type,
                emergencyDescription: service.type,
                userLocation: coords,
              },
              {
                onSuccess: response => {
                  setPendingType(null);
                  const requestId = response.data?.data?.emergencyRequest?.id;
                  router.replace({
                    pathname: '/emergency-tracking',
                    params: {
                      requestId,
                      emergencyType: service.type,
                      latitude: coords.latitude.toString(),
                      longitude: coords.longitude.toString(),
                      role: 'user',
                    },
                  });
                },
                onError: () => {
                  setPendingType(null);
                  Alert.alert(
                    'Failed',
                    'Could not send emergency request. Try the detailed form.'
                  );
                },
              }
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
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
        {/* One-tap SOS section */}
        <View style={styles.sosSection}>
          <View style={styles.sosTitleRow}>
            <View style={styles.sosTitleLine} />
            <Text style={styles.sosSectionTitle}>ONE-TAP SOS</Text>
            <View style={styles.sosTitleLine} />
          </View>

          {!locationReady && (
            <View style={styles.locationBanner}>
              <ActivityIndicator size="small" color={SIGNAL_RED} />
              <Text style={styles.locationBannerText}>
                ACQUIRING LOCATION...
              </Text>
            </View>
          )}

          <View style={styles.serviceGrid}>
            {[SERVICE_TYPES.slice(0, 2), SERVICE_TYPES.slice(2, 4)].map(
              (row, rowIdx) => (
                <View key={rowIdx} style={styles.serviceRow}>
                  {row.map(service => (
                    <TouchableOpacity
                      key={service.type}
                      style={styles.serviceCard}
                      onPress={() => handleOneTap(service)}
                      activeOpacity={0.75}
                      disabled={pendingType !== null}
                    >
                      {pendingType === service.type ? (
                        <ActivityIndicator
                          color={service.color}
                          style={styles.serviceIconWrapper}
                        />
                      ) : (
                        <View
                          style={[
                            styles.serviceIconWrapper,
                            { backgroundColor: `${service.color}18` },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={service.icon as any}
                            size={32}
                            color={service.color}
                          />
                        </View>
                      )}
                      <Text
                        style={[styles.serviceLabel, { color: service.color }]}
                      >
                        {service.label}
                      </Text>
                      <Text style={styles.serviceSublabel}>
                        {service.sublabel}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )
            )}
          </View>

          <TouchableOpacity
            style={styles.detailedButton}
            onPress={() => router.push('/emergency-request')}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={16} color={OFF_WHITE} />
            <Text style={styles.detailedButtonText}>
              DETAILED REQUEST WITH DESCRIPTION
            </Text>
          </TouchableOpacity>
        </View>

        {/* Offline Fallback */}
        <View style={styles.sectionDivider}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>OFFLINE</Text>
          <View style={styles.sectionLine} />
        </View>

        <TouchableOpacity
          style={styles.offlineRow}
          onPress={() => router.push('/sms-emergency')}
          activeOpacity={0.7}
        >
          <View style={styles.offlineLeft}>
            <Ionicons name="cloud-offline-outline" size={18} color="#D97706" />
            <View style={styles.offlineTextGroup}>
              <Text style={styles.offlineLabel}>
                NO INTERNET? SEND SMS EMERGENCY
              </Text>
              <Text style={styles.offlineSub}>TAP TO REQUEST HELP VIA SMS</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={MID_GRAY} />
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.sectionDivider}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.sectionLine} />
        </View>

        <View style={styles.quickActions}>
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/share-location')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="location" size={22} color={OFF_WHITE} />
              </View>
              <Text style={styles.quickLabel}>SHARE</Text>
              <Text style={styles.quickSubLabel}>LOCATION</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/first-aid')}
              activeOpacity={0.7}
            >
              <View style={[styles.quickIcon, { backgroundColor: SIGNAL_RED }]}>
                <Ionicons name="medkit" size={22} color={OFF_WHITE} />
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
                <Ionicons name="call" size={22} color={OFF_WHITE} />
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
    paddingTop: 0,
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
    paddingTop: 24,
    paddingBottom: 20,
  },
  // SOS section
  sosSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sosTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sosTitleLine: {
    flex: 1,
    height: 1,
    backgroundColor: LIGHT_GRAY,
  },
  sosSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: SIGNAL_RED,
    letterSpacing: 3,
    marginHorizontal: 12,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 8,
  },
  locationBannerText: {
    fontSize: 9,
    color: MID_GRAY,
    letterSpacing: 1,
  },
  serviceGrid: {
    gap: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceCard: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  serviceIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  serviceLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  serviceSublabel: {
    fontSize: 8,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  detailedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: SIGNAL_RED,
    gap: 8,
  },
  detailedButtonText: {
    fontSize: 10,
    color: OFF_WHITE,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  // Quick actions
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
  quickActions: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: OFF_WHITE,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
  },
  quickIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: BLACK,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  quickSubLabel: {
    fontSize: 8,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 2,
  },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 32,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  offlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  offlineTextGroup: {
    marginLeft: 12,
    flex: 1,
  },
  offlineLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
    letterSpacing: 1,
  },
  offlineSub: {
    fontSize: 9,
    color: '#D97706',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  // Status
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
