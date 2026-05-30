import { Ionicons } from '@expo/vector-icons';

import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UI_COLORS } from '../constants';
import { infoPageStyles as styles } from '../stylesheet';

interface InfoPageProps {
  title: string;
  tagline: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onBack?: () => void;
}

export const InfoPage: React.FC<InfoPageProps> = ({
  title,
  tagline,
  children,
  footer,
  onBack,
}) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          activeOpacity={0.7}
          disabled={!onBack}
        >
          <Ionicons name="arrow-back" size={24} color={UI_COLORS.OFF_WHITE} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.brandRow}>
            <Text style={styles.brandMark}>RESQ</Text>
            <Text style={styles.brandDot}>.</Text>
          </View>
          <View style={styles.headerLine} />
          <Text style={styles.tagline}>{tagline}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        // used by callers for accessibility/testing
        accessibilityLabel={title}
      >
        {children}
        {footer}
      </ScrollView>
    </SafeAreaView>
  );
};

interface SectionHeaderProps {
  title: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => (
  <View style={styles.sectionHeaderRow}>
    <Text style={styles.sectionHeaderTitle}>{title}</Text>
    <View style={styles.sectionHeaderLine} />
  </View>
);

interface SectionCardProps {
  number: string;
  title: string;
  content: string | React.ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  number,
  title,
  content,
}) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionCardHeader}>
      <Text style={styles.sectionNumber}>{number}</Text>
      <View style={styles.sectionLine} />
    </View>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {typeof content === 'string' ? (
        <Text style={styles.sectionContentText}>{content}</Text>
      ) : (
        content
      )}
    </View>
  </View>
);

interface InfoCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBgColor?: string;
  title: string;
  meta?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  icon,
  iconBgColor = '#FEE2E2',
  title,
  meta,
}) => (
  <View style={styles.infoCard}>
    <View style={styles.infoHeader}>
      <View style={[styles.infoIcon, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon} size={24} color={UI_COLORS.SIGNAL_RED} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoTitle}>{title}</Text>
        {meta && <Text style={styles.infoMeta}>{meta}</Text>}
      </View>
    </View>
  </View>
);

interface NoticeProps {
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  backgroundColor?: string;
  iconColor?: string;
}

export const Notice: React.FC<NoticeProps> = ({
  icon = 'information-circle-outline',
  children,
  backgroundColor = '#DBEAFE',
  iconColor = UI_COLORS.PRIMARY,
}) => (
  <View style={[styles.notice, { backgroundColor }]}>
    <Ionicons name={icon} size={18} color={iconColor} />
    <View style={styles.noticeContent}>{children}</View>
  </View>
);

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBgColor?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  iconBgColor = '#FEE2E2',
  iconColor = UI_COLORS.SIGNAL_RED,
  title,
  subtitle,
  onPress,
  showArrow = true,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    style={styles.menuItem}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[styles.menuItemIcon, { backgroundColor: iconBgColor }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.menuItemContent}>
      <Text style={styles.menuItemTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
    </View>
    {showArrow && onPress && (
      <Ionicons name="chevron-forward" size={18} color={UI_COLORS.MID_GRAY} />
    )}
  </TouchableOpacity>
);

interface FAQItemProps {
  question: string;
  answer: string;
  expanded: boolean;
  onPress: () => void;
}

export const FAQItem: React.FC<FAQItemProps> = ({
  question,
  answer,
  expanded,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.faqItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.faqHeader}>
      <Text style={styles.faqQuestion}>{question}</Text>
      <Ionicons
        name={expanded ? 'chevron-up' : 'chevron-down'}
        size={20}
        color={UI_COLORS.MID_GRAY}
      />
    </View>
    {expanded && (
      <View style={styles.faqAnswer}>
        <Text style={styles.faqAnswerText}>{answer}</Text>
      </View>
    )}
  </TouchableOpacity>
);

export default InfoPage;
