import React from 'react';
import { Text, View } from 'react-native';

import { InfoCard, InfoPage, Notice, SectionCard } from '@/components/InfoPage';
import { APP_NAME } from '@/constants';

const SIGNAL_RED = '#C44536';
const MID_GRAY = '#888888';

export default function PrivacyPolicyScreen() {
  const sections = [
    {
      number: '01',
      title: 'INFORMATION WE COLLECT',
      content: `Personal Information:
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
      number: '02',
      title: 'HOW WE USE YOUR INFORMATION',
      content: `Your information is used to:
• Provide emergency response services
• Connect you with nearby responders
• Send emergency alerts to your contacts
• Improve service quality and response times
• Communicate important updates
• Maintain account security`,
    },
    {
      number: '03',
      title: 'INFORMATION SHARING',
      content: `We may share your information with:
• Emergency responders responding to your request
• Your designated emergency contacts
• Law enforcement when required by law
• Vendors who assist in app operations

We never sell your personal information.`,
    },
    {
      number: '04',
      title: 'LOCATION DATA',
      content: `Location data is critical for emergency services:
• We collect location only when you use the app
• Location is shared with responders during emergencies
• You can disable location sharing (may affect service)
• Location history is retained for safety improvements`,
    },
    {
      number: '05',
      title: 'DATA SECURITY',
      content: `We implement security measures including:
• Encrypted data transmission (HTTPS/TLS)
• Secure server infrastructure
• Regular security audits
• Access controls and authentication

No method is 100% secure. We cannot guarantee absolute security.`,
    },
    {
      number: '06',
      title: 'DATA RETENTION',
      content: `We retain your data:
• Account information: While your account is active
• Emergency history: Up to 3 years for safety purposes
• Location data: Up to 1 year
• Deleted upon account deletion request`,
    },
    {
      number: '07',
      title: 'YOUR RIGHTS',
      content: `You have the right to:
• Access your personal data
• Correct inaccurate information
• Delete your account and data
• Opt-out of non-essential communications
• Export your data

Contact us through the app to exercise these rights.`,
    },
    {
      number: '08',
      title: "CHILDREN'S PRIVACY",
      content: `${APP_NAME} is not intended for children under 13. We do not knowingly collect information from children under 13. If you believe we have collected such information, please contact us.`,
    },
    {
      number: '09',
      title: 'CHANGES TO PRIVACY POLICY',
      content: `We may update this policy periodically. We will notify you of significant changes through the app or email. Continued use after changes constitutes acceptance.`,
    },
    {
      number: '10',
      title: 'CONTACT US',
      content: `For privacy-related questions:
• Use the Help & Support section in the app
• Email: privacy@resqconnect.app

We respond to all inquiries within 30 days.`,
    },
  ];

  return (
    <InfoPage title="PRIVACY POLICY" tagline="PRIVACY POLICY">
      <InfoCard
        icon="shield-checkmark"
        iconBgColor="#DBEAFE"
        title="YOUR PRIVACY MATTERS"
        meta="LAST UPDATED: JANUARY 2026"
      />

      <Notice backgroundColor="#DBEAFE" iconColor={SIGNAL_RED}>
        <Text
          style={{
            fontSize: 11,
            color: '#000000',
            letterSpacing: 0.5,
            lineHeight: 18,
          }}
        >
          This policy explains how {APP_NAME} collects, uses, and protects your
          personal information.
        </Text>
      </Notice>

      {sections.map((section, index) => (
        <SectionCard
          key={index}
          number={section.number}
          title={section.title}
          content={section.content}
        />
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          BY USING {APP_NAME}, YOU ACKNOWLEDGE THAT YOU HAVE READ
        </Text>
        <Text style={styles.footerText}>AND AGREE TO THIS PRIVACY POLICY.</Text>
      </View>
    </InfoPage>
  );
}

const styles = {
  footer: {
    alignItems: 'center' as const,
    paddingVertical: 24,
    marginTop: 16,
  },
  footerText: {
    fontSize: 10,
    color: MID_GRAY,
    letterSpacing: 1,
    textAlign: 'center' as const,
  },
};
