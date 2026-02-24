import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_NAME, APP_VERSION } from '@/constants';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: `By downloading, installing, or using ${APP_NAME}, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.`,
    },
    {
      title: '2. Description of Service',
      content: `${APP_NAME} is an emergency response application that connects users with emergency service providers including ambulance, police, fire department, and rescue teams. The app facilitates communication and location sharing during emergencies.`,
    },
    {
      title: '3. User Responsibilities',
      content: `You agree to:
• Provide accurate personal and location information
• Use the service only for genuine emergencies
• Not misuse the service for false reports or prank calls
• Keep your account credentials secure
• Comply with all applicable laws and regulations`,
    },
    {
      title: '4. Emergency Services Disclaimer',
      content: `${APP_NAME} is designed to supplement, not replace, traditional emergency services (e.g., calling 112). Response times depend on service provider availability and are not guaranteed. Always call emergency services directly in life-threatening situations.`,
    },
    {
      title: '5. Privacy and Data',
      content: `Your use of the service is also governed by our Privacy Policy. We collect and process location data and personal information to provide emergency services. See our Privacy Policy for details.`,
    },
    {
      title: '6. Service Availability',
      content: `We strive to maintain service availability but cannot guarantee uninterrupted access. The service may be temporarily unavailable due to maintenance, technical issues, or circumstances beyond our control.`,
    },
    {
      title: '7. Limitation of Liability',
      content: `${APP_NAME} and its operators shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use or inability to use the service, including delays in emergency response.`,
    },
    {
      title: '8. Changes to Terms',
      content: `We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.`,
    },
    {
      title: '9. Contact Information',
      content: `For questions about these Terms of Service, please contact us through the Help & Support section in the app.`,
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
            Terms of Service
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
            <View className="h-12 w-12 rounded-full bg-primary/10 items-center justify-center">
              <Ionicons name="document-text" size={24} color="#E13333" />
            </View>
            <View className="ml-3">
              <Text
                className="text-lg text-gray-800 font-semibold"
                style={{ fontFamily: 'Inter' }}
              >
                {APP_NAME}
              </Text>
              <Text
                className="text-sm text-gray-500"
                style={{ fontFamily: 'Inter' }}
              >
                Version {APP_VERSION} | Last updated: January 2026
              </Text>
            </View>
          </View>
        </View>

        {/* Terms Sections */}
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
