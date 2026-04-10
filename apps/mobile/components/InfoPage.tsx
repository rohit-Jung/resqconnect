import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SIGNAL_RED = '#C44536';
const PRIMARY = '#E63946';
const OFF_WHITE = '#F5F4F0';
const BLACK = '#000000';
const MID_GRAY = '#888888';
const LIGHT_GRAY = '#E8E6E1';

interface InfoPageProps {
  title: string;
  tagline: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const InfoPage: React.FC<InfoPageProps> = ({
  title,
  tagline,
  children,
  footer,
}) => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={OFF_WHITE} />
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
        <Ionicons name={icon} size={24} color={SIGNAL_RED} />
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
  iconColor = PRIMARY,
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
  iconColor = SIGNAL_RED,
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
      <Ionicons name="chevron-forward" size={18} color={MID_GRAY} />
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
        color={MID_GRAY}
      />
    </View>
    {expanded && (
      <View style={styles.faqAnswer}>
        <Text style={styles.faqAnswerText}>{answer}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
    paddingTop: 0,
  },
  backButton: {
    padding: 10,
    backgroundColor: SIGNAL_RED,
    marginRight: 16,
  },
  headerCenter: {
    flex: 1,
  },
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
    width: 36,
    height: 2,
    backgroundColor: SIGNAL_RED,
    marginTop: 6,
    marginBottom: 6,
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionCard: {
    marginBottom: 24,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: MID_GRAY,
    letterSpacing: 2,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: LIGHT_GRAY,
    marginLeft: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: SIGNAL_RED,
    letterSpacing: 1,
    width: 24,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: LIGHT_GRAY,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionContent: {
    paddingLeft: 24,
  },
  sectionContentText: {
    fontSize: 12,
    color: MID_GRAY,
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    padding: 20,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: BLACK,
    letterSpacing: 2,
    marginBottom: 4,
  },
  infoMeta: {
    fontSize: 10,
    color: MID_GRAY,
    letterSpacing: 1,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    marginBottom: 24,
  },
  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  noticeText: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    padding: 16,
    marginBottom: 8,
  },
  menuItemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: BLACK,
    letterSpacing: 1,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 0.5,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: LIGHT_GRAY,
    padding: 16,
    marginBottom: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: BLACK,
    letterSpacing: 0.5,
    marginRight: 8,
  },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
  },
  faqAnswerText: {
    fontSize: 11,
    color: MID_GRAY,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginTop: 16,
  },
  footerText: {
    fontSize: 10,
    color: MID_GRAY,
    letterSpacing: 1,
    textAlign: 'center',
  },
});

export default InfoPage;
