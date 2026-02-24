import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_NAME, APP_VERSION } from '@/constants';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const sections = [
    {
      title: '1. Information We Collect',
      content: `We collect the following types of information:

Personal Information:
• Name, email address, and phone number
• Age and primary address
• Account credentials

Location Data:
• Real-time GPS location during emergencies
• Location history for emergency response optimization

Device Information:
• Device type and operating system
• Push notification tokens`,
    },
    {
      title: '2. How We Use Your Information',
      content: `Your information is used to:
• Provide emergency response services
• Connect you with nearby service providers
• Send emergency alerts to your contacts
• Improve service quality and response times
• Communicate important updates
• Maintain account security`,
    },
    {
      title: '3. Information Sharing',
      content: `We may share your information with:
• Emergency service providers responding to your request
• Your designated emergency contacts (when enabled)
• Law enforcement when required by law
• Service providers who assist in app operations

We never sell your personal information to third parties.`,
    },
    {
      title: '4. Location Data',
      content: `Location data is critical for emergency services:
• We collect location only when you use the app
• Location is shared with responders during emergencies
• You can disable location sharing (may affect service)
• Location history is retained for safety improvements`,
    },
    {
      title: '5. Data Security',
      content: `We implement security measures including:
• Encrypted data transmission (HTTPS/TLS)
• Secure server infrastructure
• Regular security audits
• Access controls and authentication

No method of electronic transmission is 100% secure. We cannot guarantee absolute security.`,
    },
    {
      title: '6. Data Retention',
      content: `We retain your data:
• Account information: While your account is active
• Emergency history: Up to 3 years for safety purposes
• Location data: Up to 1 year
• Deleted upon account deletion request`,
    },
    {
      title: '7. Your Rights',
      content: `You have the right to:
• Access your personal data
• Correct inaccurate information
• Delete your account and data
• Opt-out of non-essential communications
• Export your data

Contact us through the app to exercise these rights.`,
    },
    {
      title: "8. Children's Privacy",
      content: `${APP_NAME} is not intended for children under 13. We do not knowingly collect information from children under 13. If you believe we have collected such information, please contact us.`,
    },
    {
      title: '9. Changes to Privacy Policy',
      content: `We may update this policy periodically. We will notify you of significant changes through the app or email. Continued use after changes constitutes acceptance.`,
    },
    {
      title: '10. Contact Us',
      content: `For privacy-related questions or concerns:
• Use the Help & Support section in the app
• Email: privacy@resqconnect.app

We respond to all inquiries within 30 days.`,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-primary px-5 py-4">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text
            className="text-xl text-white"
            style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
          >
            Privacy Policy
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header Info */}
        <View
          className="bg-white rounded-2xl p-4 mb-4 shadow-sm"
          style={{ elevation: 2 }}
        >
          <View className="flex-row items-center">
            <View className="h-12 w-12 rounded-full bg-blue-100 items-center justify-center">
              <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
            </View>
            <View className="ml-3 flex-1">
              <Text
                className="text-lg text-gray-800 font-semibold"
                style={{ fontFamily: 'Inter' }}
              >
                Your Privacy Matters
              </Text>
              <Text
                className="text-sm text-gray-500"
                style={{ fontFamily: 'Inter' }}
              >
                Last updated: January 2026
              </Text>
            </View>
          </View>
        </View>

        {/* Privacy Notice */}
        <View className="bg-blue-50 rounded-2xl p-4 mb-4 flex-row">
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <Text
            className="ml-2 text-sm text-blue-800 flex-1"
            style={{ fontFamily: 'Inter' }}
          >
            This policy explains how {APP_NAME} collects, uses, and protects
            your personal information.
          </Text>
        </View>

        {/* Policy Sections */}
        {sections.map((section, index) => (
          <View
            key={index}
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
            style={{ elevation: 1 }}
          >
            <Text
              className="text-base text-gray-800 font-semibold mb-2"
              style={{ fontFamily: 'Inter' }}
            >
              {section.title}
            </Text>
            <Text
              className="text-sm text-gray-600 leading-6"
              style={{ fontFamily: 'Inter' }}
            >
              {section.content}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
