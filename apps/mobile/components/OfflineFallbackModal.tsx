import { Ionicons } from '@expo/vector-icons';

import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import * as SMS from 'expo-sms';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { EMERGENCY_PHONE_NUMBER, SMS_FALLBACK_NUMBER } from '@/constants';
import { useAuthStore } from '@/store/authStore';
import { useOfflineQueueStore } from '@/store/offlineQueueStore';
import {
  SMSEmergencyData,
  formatEmergencyMessage,
  formatEmergencyType,
} from '@/utils/sms.utils';

interface OfflineFallbackModalProps {
  visible: boolean;
  onClose: () => void;
  emergencyType: string;
  location: Location.LocationObject | null;
  description?: string;
  onRetryOnline?: () => Promise<boolean>;
  autoSMSAfterTimeout?: number; // Seconds to wait before suggesting SMS
}

export const OfflineFallbackModal: React.FC<OfflineFallbackModalProps> = ({
  visible,
  onClose,
  emergencyType,
  location,
  description,
  onRetryOnline,
  autoSMSAfterTimeout = 15,
}) => {
  const router = useRouter();
  const { user } = useAuthStore();
  const addToQueue = useOfflineQueueStore(state => state.addToQueue);

  const [isRetrying, setIsRetrying] = useState(false);
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [timeoutSeconds, setTimeoutSeconds] = useState(autoSMSAfterTimeout);
  const [showSMSSuggestion, setShowSMSSuggestion] = useState(false);

  // Countdown timer for SMS suggestion
  useEffect(() => {
    if (!visible) {
      setTimeoutSeconds(autoSMSAfterTimeout);
      setShowSMSSuggestion(false);
      return;
    }

    const interval = setInterval(() => {
      setTimeoutSeconds(prev => {
        if (prev <= 1) {
          setShowSMSSuggestion(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, autoSMSAfterTimeout]);

  // Queue the request locally when modal opens
  useEffect(() => {
    if (visible && location) {
      addToQueue({
        emergencyType,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        description,
        userId: user?.id,
        userName: user?.name,
        userPhone: user?.phoneNumber?.toString(),
      });
    }
  }, [visible]); // Only run when modal becomes visible

  const handleRetryOnline = useCallback(async () => {
    if (!onRetryOnline) return;

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      const success = await onRetryOnline();
      if (success) {
        onClose();
      } else {
        if (retryCount >= 2) {
          setShowSMSSuggestion(true);
        }
      }
    } catch (error) {
      console.error('Retry failed:', error);
      if (retryCount >= 2) {
        setShowSMSSuggestion(true);
      }
    } finally {
      setIsRetrying(false);
    }
  }, [onRetryOnline, retryCount, onClose]);

  const handleSendSMS = useCallback(async () => {
    if (!location) {
      Alert.alert('Error', 'Location is required to send emergency SMS.');
      return;
    }

    const smsAvailable = await SMS.isAvailableAsync();
    if (!smsAvailable) {
      Alert.alert(
        'SMS Not Available',
        'SMS is not available on this device. Would you like to call emergency services instead?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Call ${EMERGENCY_PHONE_NUMBER}`,
            onPress: () => {
              // Navigate to phone dialer
              router.push(`tel:${EMERGENCY_PHONE_NUMBER}` as any);
            },
          },
        ]
      );
      return;
    }

    setIsSendingSMS(true);

    try {
      const emergencyData: SMSEmergencyData = {
        emergencyType,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        description,
        userName: user?.name,
        userPhone: user?.phoneNumber?.toString(),
        userId: user?.id,
      };

      const message = formatEmergencyMessage(emergencyData);
      const { result } = await SMS.sendSMSAsync([SMS_FALLBACK_NUMBER], message);

      if (result === 'sent') {
        Alert.alert(
          'Emergency SMS Sent',
          'Your emergency request has been sent via SMS. Help is on the way.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else if (result === 'cancelled') {
        // User cancelled, keep modal open
      } else {
        Alert.alert(
          'SMS Status Unknown',
          'We could not confirm if the SMS was sent. Please try again or call emergency services.',
          [
            { text: 'Try Again', style: 'cancel' },
            {
              text: `Call ${EMERGENCY_PHONE_NUMBER}`,
              onPress: () => {
                router.push(`tel:${EMERGENCY_PHONE_NUMBER}` as any);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('SMS error:', error);
      Alert.alert(
        'SMS Failed',
        'Failed to send SMS. Please call emergency services directly.',
        [
          { text: 'OK', style: 'cancel' },
          {
            text: `Call ${EMERGENCY_PHONE_NUMBER}`,
            onPress: () => {
              router.push(`tel:${EMERGENCY_PHONE_NUMBER}` as any);
            },
          },
        ]
      );
    } finally {
      setIsSendingSMS(false);
    }
  }, [location, emergencyType, description, user, onClose, router]);

  const handleGoToSMSScreen = useCallback(() => {
    onClose();
    router.push({
      pathname: '/sms-emergency',
      params: { emergencyType },
    });
  }, [onClose, router, emergencyType]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      >
        <View className="w-full rounded-3xl bg-white p-6">
          {/* Header */}
          <View className="items-center mb-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-amber-100 mb-3">
              <Ionicons name="cloud-offline" size={32} color="#F59E0B" />
            </View>
            <Text
              className="text-xl text-gray-800 text-center"
              style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
            >
              Connection Lost
            </Text>
            <Text
              className="text-sm text-gray-500 text-center mt-1"
              style={{ fontFamily: 'Inter' }}
            >
              Unable to connect to our servers
            </Text>
          </View>

          {/* Emergency Type Badge */}
          <View className="bg-red-50 rounded-xl p-3 mb-4 flex-row items-center">
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <View className="ml-2 flex-1">
              <Text
                className="text-xs text-red-500"
                style={{ fontFamily: 'Inter' }}
              >
                Emergency Type
              </Text>
              <Text
                className="text-sm font-semibold text-red-700"
                style={{ fontFamily: 'Inter' }}
              >
                {formatEmergencyType(emergencyType)}
              </Text>
            </View>
          </View>

          {/* Status / Timer */}
          {!showSMSSuggestion && (
            <View className="bg-gray-50 rounded-xl p-3 mb-4 items-center">
              <Text
                className="text-sm text-gray-600"
                style={{ fontFamily: 'Inter' }}
              >
                Your request has been queued locally.
              </Text>
              <Text
                className="text-xs text-gray-400 mt-1"
                style={{ fontFamily: 'Inter' }}
              >
                SMS option in {timeoutSeconds}s...
              </Text>
            </View>
          )}

          {/* SMS Suggestion */}
          {showSMSSuggestion && (
            <View className="bg-amber-50 rounded-xl p-3 mb-4">
              <Text
                className="text-sm text-amber-800 text-center"
                style={{ fontFamily: 'Inter' }}
              >
                Still offline? Send your emergency request via SMS for immediate
                processing.
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View>
            {/* Retry Online */}
            {onRetryOnline && (
              <TouchableOpacity
                onPress={handleRetryOnline}
                disabled={isRetrying}
                className={`rounded-xl py-3 flex-row items-center justify-center mb-3 ${
                  isRetrying ? 'bg-gray-200' : 'bg-blue-500'
                }`}
                activeOpacity={0.8}
              >
                {isRetrying ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={18} color="#fff" />
                    <Text
                      className="ml-2 text-white font-semibold"
                      style={{ fontFamily: 'Inter' }}
                    >
                      Try Again ({retryCount}/3)
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Send via SMS */}
            <TouchableOpacity
              onPress={handleSendSMS}
              disabled={isSendingSMS || !location}
              className={`rounded-xl py-3 flex-row items-center justify-center mb-3 ${
                showSMSSuggestion ? 'bg-amber-500' : 'bg-amber-400'
              }`}
              style={{ opacity: isSendingSMS || !location ? 0.5 : 1 }}
              activeOpacity={0.8}
            >
              {isSendingSMS ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#fff" />
                  <Text
                    className="ml-2 text-white font-semibold"
                    style={{ fontFamily: 'Inter' }}
                  >
                    Send via SMS
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* More SMS Options */}
            <TouchableOpacity
              onPress={handleGoToSMSScreen}
              className="rounded-xl py-3 flex-row items-center justify-center border border-gray-200 mb-3"
              activeOpacity={0.8}
            >
              <Ionicons name="options-outline" size={18} color="#6B7280" />
              <Text
                className="ml-2 text-gray-600 font-medium"
                style={{ fontFamily: 'Inter' }}
              >
                More Options
              </Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              onPress={onClose}
              className="py-2"
              activeOpacity={0.8}
            >
              <Text
                className="text-gray-400 text-center text-sm"
                style={{ fontFamily: 'Inter' }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default OfflineFallbackModal;
