import React from 'react';
import { Text, View } from 'react-native';

import { InfoCard, InfoPage, SectionCard } from '@/components/InfoPage';
import { APP_NAME, APP_VERSION } from '@/constants';

const SIGNAL_RED = '#C44536';
const MID_GRAY = '#888888';

export default function TermsOfServiceScreen() {
  const sections = [
    {
      number: '01',
      title: 'ACCEPTANCE OF TERMS',
      content: `By downloading, installing, or using ${APP_NAME}, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.`,
    },
    {
      number: '02',
      title: 'DESCRIPTION OF SERVICE',
      content: `${APP_NAME} is an emergency response application that connects users with emergency responders including ambulance, police, fire department, and rescue teams. The app facilitates communication and location sharing during emergencies.`,
    },
    {
      number: '03',
      title: 'USER RESPONSIBILITIES',
      content: `You agree to:
• Provide accurate personal and location information
• Use the service only for genuine emergencies
• Not misuse the service for false reports
• Keep your account credentials secure
• Comply with all applicable laws`,
    },
    {
      number: '04',
      title: 'EMERGENCY SERVICES DISCLAIMER',
      content: `${APP_NAME} is designed to supplement, not replace, traditional emergency services (e.g., calling 112). Response times depend on responder availability and are not guaranteed.`,
    },
    {
      number: '05',
      title: 'PRIVACY AND DATA',
      content: `Your use of the service is governed by our Privacy Policy. We collect and process location data and personal information to provide emergency services.`,
    },
    {
      number: '06',
      title: 'SERVICE AVAILABILITY',
      content: `We strive to maintain service availability but cannot guarantee uninterrupted access. The service may be temporarily unavailable due to maintenance or technical issues.`,
    },
    {
      number: '07',
      title: 'LIMITATION OF LIABILITY',
      content: `${APP_NAME} and its operators shall not be liable for any direct, indirect, or consequential damages arising from the use or inability to use the service.`,
    },
    {
      number: '08',
      title: 'CHANGES TO TERMS',
      content: `We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.`,
    },
    {
      number: '09',
      title: 'CONTACT INFORMATION',
      content: `For questions about these Terms of Service, please contact us through the Help & Support section in the app.`,
    },
  ];

  return (
    <InfoPage title="TERMS OF SERVICE" tagline="TERMS OF SERVICE">
      <InfoCard
        icon="document-text"
        iconBgColor="#FEE2E2"
        title={APP_NAME}
        meta={`VERSION ${APP_VERSION} • JANUARY 2026`}
      />

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
        <Text style={styles.footerText}>AND AGREE TO THESE TERMS.</Text>
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
