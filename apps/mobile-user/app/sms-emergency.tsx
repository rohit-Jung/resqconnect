import { Ionicons } from '@expo/vector-icons';

import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SMS from 'expo-sms';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EMERGENCY_PHONE_NUMBER, SMS_FALLBACK_NUMBER } from '@/constants';
import { useAuthStore } from '@/store/authStore';
import {
  SMSEmergencyData,
  formatEmergencyMessage,
  formatEmergencyType,
  getGoogleMapsLink,
  getSMSFallbackNumber,
} from '@/utils/sms.utils';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const BLACK = '#000000';

const EMERGENCY_TYPES = [
  { value: 'ambulance', label: 'Medical', icon: 'medical', color: SIGNAL_RED },
  { value: 'police', label: 'Police', icon: 'shield', color: '#3B82F6' },
  { value: 'fire_truck', label: 'Fire', icon: 'flame', color: '#F97316' },
  { value: 'rescue_team', label: 'Rescue', icon: 'people', color: '#8B5CF6' },
] as const;

export default function SMSEmergencyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();

  const [selectedType, setSelectedType] = useState<string>(
    (params.emergencyType as string) || 'ambulance'
  );
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [smsAvailable, setSmsAvailable] = useState(true);

  useEffect(() => {
    const checkSMS = async () => {
      const isAvailable = await SMS.isAvailableAsync();
      setSmsAvailable(isAvailable);
    };
    checkSMS();
    getLocation();
  }, []);

  const getLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'PERMISSION DENIED',
          'Location permission is required to send your location in the emergency SMS.'
        );
        setIsLoadingLocation(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('ERROR', 'Failed to get your location. Please try again.');
    }
    setIsLoadingLocation(false);
  };

  const handleSendSMS = async () => {
    if (!location) {
      Alert.alert('ERROR', 'Location is required. Please wait or refresh.');
      return;
    }

    if (!smsAvailable) {
      Alert.alert(
        'SMS NOT AVAILABLE',
        'SMS is not available on this device. Please call emergency services instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'CALL ' + EMERGENCY_PHONE_NUMBER,
            onPress: () => Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`),
          },
        ]
      );
      return;
    }

    setIsSending(true);

    try {
      const emergencyData: SMSEmergencyData = {
        emergencyType: selectedType,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        description: description.trim() || undefined,
        userName: user?.name,
        userPhone: user?.phoneNumber?.toString(),
        userId: user?.id,
      };

      const message = formatEmergencyMessage(emergencyData);
      const fallbackNumber = getSMSFallbackNumber();

      const { result } = await SMS.sendSMSAsync([fallbackNumber], message);

      if (result === 'sent') {
        Alert.alert(
          'EMERGENCY SMS SENT',
          'Your emergency request has been sent via SMS. Help is on the way. You can also call emergency services directly.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
            {
              text: 'CALL ' + EMERGENCY_PHONE_NUMBER,
              onPress: () => {
                Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`);
                router.back();
              },
            },
          ]
        );
      } else if (result === 'cancelled') {
        Alert.alert('CANCELLED', 'SMS was not sent.');
      } else {
        Alert.alert(
          'SMS STATUS UNKNOWN',
          'We could not confirm if the SMS was sent. Please try again or call emergency services.',
          [
            { text: 'RETRY', onPress: () => setIsSending(false) },
            {
              text: 'CALL ' + EMERGENCY_PHONE_NUMBER,
              onPress: () => Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      Alert.alert(
        'ERROR',
        'Failed to send SMS. Please call emergency services directly.',
        [
          { text: 'OK' },
          {
            text: 'CALL ' + EMERGENCY_PHONE_NUMBER,
            onPress: () => Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`),
          },
        ]
      );
    }

    setIsSending(false);
  };

  const handleCallEmergency = () => {
    Linking.openURL(`tel:${EMERGENCY_PHONE_NUMBER}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Swiss style */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={BLACK} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>RESQ</Text>
            <Text style={styles.brandDot}>.</Text>
          </View>
          <View style={styles.headerLine} />
          <Text style={styles.tagline}>OFFLINE EMERGENCY</Text>
        </View>
      </View>

      {/* Offline Banner */}
      <View style={styles.offlineBanner}>
        <Ionicons name="cloud-offline" size={18} color="#F59E0B" />
        <Text style={styles.offlineText}>
          YOU APPEAR TO BE OFFLINE. USE SMS TO REQUEST EMERGENCY HELP.
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Emergency Type Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>EMERGENCY TYPE</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.typeGrid}>
            {EMERGENCY_TYPES.map(type => (
              <TouchableOpacity
                key={type.value}
                onPress={() => setSelectedType(type.value)}
                style={[
                  styles.typeCard,
                  selectedType === type.value && styles.typeCardActive,
                  {
                    borderColor:
                      selectedType === type.value ? type.color : LIGHT_GRAY,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={type.icon as any}
                  size={28}
                  color={selectedType === type.value ? type.color : MID_GRAY}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    selectedType === type.value && { color: type.color },
                  ]}
                >
                  {type.label.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR LOCATION</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.locationCard}>
            {isLoadingLocation ? (
              <View style={styles.locationLoading}>
                <ActivityIndicator size="small" color={SIGNAL_RED} />
                <Text style={styles.locationLoadingText}>
                  GETTING YOUR LOCATION...
                </Text>
              </View>
            ) : location ? (
              <View>
                <View style={styles.locationStatus}>
                  <Ionicons name="location" size={18} color="#10B981" />
                  <Text style={styles.locationStatusText}>
                    LOCATION ACQUIRED
                  </Text>
                </View>
                <Text style={styles.locationCoords}>
                  {location.coords.latitude.toFixed(6)},{' '}
                  {location.coords.longitude.toFixed(6)}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      getGoogleMapsLink(
                        location.coords.latitude,
                        location.coords.longitude
                      )
                    )
                  }
                  style={styles.mapsLink}
                >
                  <Ionicons name="map-outline" size={16} color="#3B82F6" />
                  <Text style={styles.mapsLinkText}>VIEW ON MAPS</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.locationStatus}>
                  <Ionicons
                    name="location-outline"
                    size={18}
                    color={SIGNAL_RED}
                  />
                  <Text style={styles.locationErrorText}>
                    LOCATION NOT AVAILABLE
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={getLocation}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonText}>RETRY</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              ADDITIONAL DETAILS (OPTIONAL)
            </Text>
            <View style={styles.sectionLine} />
          </View>

          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe your emergency..."
            placeholderTextColor={MID_GRAY}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* SMS Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SMS PREVIEW</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.smsPreview}>
            <Text style={styles.smsPreviewTo}>TO: {SMS_FALLBACK_NUMBER}</Text>
            <View style={styles.smsPreviewDivider} />
            <Text style={styles.smsPreviewContent}>
              [ResQ Connect EMERGENCY]{'\n'}
              Type: {formatEmergencyType(selectedType)}
              {'\n'}
              Location:{' '}
              {location
                ? `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`
                : 'Getting...'}
              {description ? `\nDetails: ${description}` : ''}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSendSMS}
          disabled={
            isSending || isLoadingLocation || !location || !smsAvailable
          }
          style={[
            styles.sendButton,
            (isSending || isLoadingLocation || !location || !smsAvailable) &&
              styles.sendButtonDisabled,
          ]}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={OFF_WHITE} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={OFF_WHITE} />
              <Text style={styles.sendButtonText}>SEND EMERGENCY SMS</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCallEmergency}
          style={styles.callButton}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={20} color={OFF_WHITE} />
          <Text style={styles.callButtonText}>
            CALL {EMERGENCY_PHONE_NUMBER}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    backgroundColor: LIGHT_GRAY,
  },
  headerContent: {},
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 22,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 22,
    fontWeight: '900',
    color: SIGNAL_RED,
    lineHeight: 26,
  },
  headerLine: {
    width: 30,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 4,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  offlineText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
    letterSpacing: 0.5,
    marginLeft: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  typeCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: '1%',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  typeCardActive: {
    backgroundColor: LIGHT_GRAY,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: MID_GRAY,
    letterSpacing: 1,
    marginTop: 12,
  },
  locationCard: {
    backgroundColor: LIGHT_GRAY,
    padding: 16,
  },
  locationLoading: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationLoadingText: {
    fontSize: 12,
    color: MID_GRAY,
    marginLeft: 12,
    letterSpacing: 1,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 8,
    letterSpacing: 1,
  },
  locationErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: SIGNAL_RED,
    marginLeft: 8,
    letterSpacing: 1,
  },
  locationCoords: {
    fontSize: 12,
    color: BLACK,
    marginBottom: 8,
  },
  mapsLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapsLinkText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 6,
    fontWeight: '600',
    letterSpacing: 1,
  },
  retryButton: {
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: BLACK,
    letterSpacing: 1,
  },
  descriptionInput: {
    backgroundColor: LIGHT_GRAY,
    padding: 16,
    fontSize: 14,
    color: BLACK,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  smsPreview: {
    backgroundColor: LIGHT_GRAY,
    padding: 16,
  },
  smsPreviewTo: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 1,
  },
  smsPreviewDivider: {
    height: 1,
    backgroundColor: MID_GRAY,
    marginVertical: 12,
    opacity: 0.3,
  },
  smsPreviewContent: {
    fontSize: 12,
    color: BLACK,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
    backgroundColor: OFF_WHITE,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SIGNAL_RED,
    paddingVertical: 16,
    marginBottom: 12,
  },
  sendButtonDisabled: {
    backgroundColor: MID_GRAY,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 2,
    marginLeft: 8,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
  },
  callButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 2,
    marginLeft: 8,
  },
});
