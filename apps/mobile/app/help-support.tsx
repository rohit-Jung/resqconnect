import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccordionItem } from '@/components/ui/Accordion';
import { APP_NAME, EMERGENCY_PHONE_NUMBER } from '@/constants';

interface SupportItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
  iconBgColor?: string;
  iconColor?: string;
}

const SupportItem: React.FC<SupportItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  iconBgColor = '#FEE2E2',
  iconColor = '#E13333',
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center bg-white rounded-2xl p-4 mb-3 shadow-sm"
    style={{ elevation: 2 }}
    activeOpacity={0.7}
  >
    <View
      className="h-12 w-12 rounded-full items-center justify-center mr-4"
      style={{ backgroundColor: iconBgColor }}
    >
      <Ionicons name={icon} size={24} color={iconColor} />
    </View>
    <View className="flex-1">
      <Text
        className="text-base text-gray-800 font-semibold"
        style={{ fontFamily: 'Inter' }}
      >
        {title}
      </Text>
      <Text
        className="text-sm text-gray-500 mt-0.5"
        style={{ fontFamily: 'Inter' }}
      >
        {subtitle}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
  </TouchableOpacity>
);

export default function HelpSupportScreen() {
  const router = useRouter();

  const faqs = [
    {
      question: 'How do I request emergency help?',
      answer: `To request emergency help:
1. Open the app and go to the Home screen
2. Tap the "SOS" button or select an emergency type
3. Confirm your location on the map
4. Describe your emergency
5. Tap "Send Emergency Request"

Your request will be sent to nearby service providers who can respond to your emergency.`,
    },
    {
      question: 'What happens when I send an emergency request?',
      answer: `When you send an emergency request:
1. Nearby emergency service providers are notified
2. A provider accepts your request
3. You can track the provider's location in real-time
4. Your emergency contacts are notified (if enabled)
5. The provider arrives to assist you

You'll receive updates throughout the process.`,
    },
    {
      question: 'Can I use the app when offline?',
      answer: `Yes! When you're offline, you can still request emergency help via SMS. The app will detect your offline status and offer the SMS emergency option. Your location and emergency details will be sent via text message to our emergency SMS gateway.`,
    },
    {
      question: 'How do emergency contacts work?',
      answer: `Emergency contacts are people you trust who will be notified when you request emergency help:
• Add contacts in the "Contacts" tab
• Enable/disable notifications for each contact
• Choose notification method (SMS, app notification, or both)
• Contacts receive your location and emergency type`,
    },
    {
      question: 'How accurate is the location tracking?',
      answer: `The app uses your device's GPS for location accuracy. Factors affecting accuracy:
• GPS signal strength
• Indoor vs outdoor use
• Device capabilities

For best results, ensure location services are enabled and you have a clear view of the sky when outdoors.`,
    },
    {
      question: 'Is my personal information secure?',
      answer: `Yes, we take your privacy seriously:
• All data is encrypted in transit
• Location is only shared during emergencies
• We never sell your data
• You can delete your account anytime

Read our Privacy Policy for more details.`,
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
            Help & Support
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Emergency Banner */}
        <TouchableOpacity
          onPress={handleEmergencyCall}
          className="bg-red-500 rounded-2xl p-4 mb-4 flex-row items-center"
          activeOpacity={0.8}
        >
          <View className="h-12 w-12 rounded-full bg-white/20 items-center justify-center">
            <Ionicons name="call" size={24} color="#fff" />
          </View>
          <View className="ml-3 flex-1">
            <Text
              className="text-white font-bold text-lg"
              style={{ fontFamily: 'Inter' }}
            >
              Emergency? Call {EMERGENCY_PHONE_NUMBER}
            </Text>
            <Text
              className="text-white/80 text-sm"
              style={{ fontFamily: 'Inter' }}
            >
              For immediate emergency assistance
            </Text>
          </View>
        </TouchableOpacity>

        {/* Contact Options */}
        <Text
          className="text-lg text-gray-800 mb-3"
          style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
        >
          Contact Us
        </Text>

        <SupportItem
          icon="mail-outline"
          title="Email Support"
          subtitle="support@resqconnect.app"
          onPress={handleEmail}
          iconBgColor="#DBEAFE"
          iconColor="#3B82F6"
        />

        <SupportItem
          icon="call-outline"
          title="Phone Support"
          subtitle="Available 9 AM - 6 PM"
          onPress={handleCall}
          iconBgColor="#D1FAE5"
          iconColor="#10B981"
        />

        <SupportItem
          icon="chatbubbles-outline"
          title="Live Chat"
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

        {/* FAQs */}
        <Text
          className="text-lg text-gray-800 mb-3 mt-4"
          style={{ fontFamily: 'ChauPhilomeneOne_400Regular' }}
        >
          Frequently Asked Questions
        </Text>

        <View className="rounded-2xl overflow-hidden">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              title={faq.question}
              icon="help-circle-outline"
              iconColor="#E13333"
            >
              <Text
                className="text-sm text-gray-600 leading-6"
                style={{ fontFamily: 'Inter' }}
              >
                {faq.answer}
              </Text>
            </AccordionItem>
          ))}
        </View>

        {/* App Info */}
        <View className="mt-6 items-center">
          <Text
            className="text-gray-400 text-sm"
            style={{ fontFamily: 'Inter' }}
          >
            {APP_NAME}
          </Text>
          <Text
            className="text-gray-400 text-xs mt-1"
            style={{ fontFamily: 'Inter' }}
          >
            Making emergencies easier to handle
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
