import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FAQItem, InfoPage, MenuItem } from '@/components/InfoPage';
import { APP_NAME, EMERGENCY_PHONE_NUMBER } from '@/constants';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';
const SUCCESS_GREEN = '#10B981';

export default function HelpSupportScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I request emergency help?',
      answer: `To request emergency help:
1. Open the app and go to the Home screen
2. Tap the "SOS" button or select an emergency type
3. Confirm your location on the map
4. Describe your emergency
5. Tap "Send Emergency Request"`,
    },
    {
      question: 'What happens when I send an emergency request?',
      answer: `When you send an emergency request:
1. Nearby emergency responders are notified
2. A responder accepts your request
3. You can track the responder's location
4. Your emergency contacts are notified
5. The responder arrives to assist you`,
    },
    {
      question: 'Can I use the app when offline?',
      answer: `Yes! When you're offline, you can still request emergency help via SMS. The app will detect your offline status and offer the SMS emergency option.`,
    },
    {
      question: 'How do emergency contacts work?',
      answer: `Emergency contacts are people you trust who will be notified when you request emergency help. Add contacts in the "Contacts" tab and enable notifications.`,
    },
    {
      question: 'Is my personal information secure?',
      answer: `Yes, we take your privacy seriously. All data is encrypted in transit, location is only shared during emergencies, and we never sell your data.`,
    },
    {
      question: 'How do I change my password?',
      answer: `To change your password:
1. Go to Settings
2. Tap "Change Password"
3. Enter your current password
4. Enter your new password twice
5. Tap "Update Password"`,
    },
  ];

  const handleEmail = () => {
    Linking.openURL('mailto:support@resqconnect.app?subject=Help Request');
  };

  const handleCall = () => {
    Alert.alert(
      'Call Support',
      'This will open your phone dialer. For emergencies, please call 112 directly.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call Support',
          onPress: () => Linking.openURL('tel:+919876543210'),
        },
      ]
    );
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Emergency Call',
      `This will dial ${EMERGENCY_PHONE_NUMBER}. Use this only for real emergencies.`,
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

  return (
    <InfoPage title="HELP & SUPPORT" tagline="HELP & SUPPORT">
      <TouchableOpacity
        style={styles.emergencyBanner}
        onPress={handleEmergencyCall}
        activeOpacity={0.8}
      >
        <View style={styles.emergencyIcon}>
          <Ionicons name="call" size={28} color={OFF_WHITE} />
        </View>
        <View style={styles.emergencyContent}>
          <Text style={styles.emergencyTitle}>
            EMERGENCY? CALL {EMERGENCY_PHONE_NUMBER}
          </Text>
          <Text style={styles.emergencySubtitle}>
            For immediate emergency assistance
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>CONTACT US</Text>

      <MenuItem
        icon="mail-outline"
        title="EMAIL SUPPORT"
        subtitle="support@resqconnect.app"
        onPress={handleEmail}
        iconBgColor="#DBEAFE"
        iconColor="#3B82F6"
      />

      <MenuItem
        icon="call-outline"
        title="PHONE SUPPORT"
        subtitle="Available 9 AM - 6 PM"
        onPress={handleCall}
        iconBgColor="#D1FAE5"
        iconColor={SUCCESS_GREEN}
      />

      <MenuItem
        icon="chatbubbles-outline"
        title="LIVE CHAT"
        subtitle="Coming soon"
        onPress={() =>
          Alert.alert(
            'Coming Soon',
            'Live chat support will be available soon.'
          )
        }
        iconBgColor="#FEF3C7"
        iconColor="#F59E0B"
      />

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>FAQ</Text>

      {faqs.map((faq, index) => (
        <FAQItem
          key={index}
          question={faq.question}
          answer={faq.answer}
          expanded={expandedFaq === index}
          onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
        />
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>{APP_NAME}</Text>
        <Text style={styles.footerSubtext}>
          Making emergencies easier to handle
        </Text>
      </View>
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SIGNAL_RED,
    padding: 20,
    marginBottom: 24,
  },
  emergencyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: OFF_WHITE,
    letterSpacing: 1,
    marginBottom: 4,
  },
  emergencySubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 2,
    marginBottom: 12,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  footerSubtext: {
    fontSize: 10,
    color: MID_GRAY,
    letterSpacing: 1,
    marginTop: 4,
  },
});
