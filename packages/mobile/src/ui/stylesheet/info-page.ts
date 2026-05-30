import { StyleSheet } from 'react-native';

import { UI_COLORS } from '../constants';

export const infoPageStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_COLORS.OFF_WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_COLORS.OFF_WHITE,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.LIGHT_GRAY,
    paddingTop: 0,
  },
  backButton: {
    padding: 10,
    backgroundColor: UI_COLORS.SIGNAL_RED,
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
    color: UI_COLORS.BLACK,
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 22,
    fontWeight: '900',
    color: UI_COLORS.SIGNAL_RED,
    lineHeight: 26,
  },
  headerLine: {
    width: 36,
    height: 2,
    backgroundColor: UI_COLORS.SIGNAL_RED,
    marginTop: 6,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
    color: UI_COLORS.MID_GRAY,
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
    color: UI_COLORS.MID_GRAY,
    letterSpacing: 2,
  },
  sectionHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: UI_COLORS.LIGHT_GRAY,
    marginLeft: 16,
  },
  sectionNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: UI_COLORS.SIGNAL_RED,
    letterSpacing: 1,
    width: 24,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: UI_COLORS.LIGHT_GRAY,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: UI_COLORS.BLACK,
    letterSpacing: 1,
    marginBottom: 8,
  },
  sectionContent: {
    paddingLeft: 24,
  },
  sectionContentText: {
    fontSize: 12,
    color: UI_COLORS.MID_GRAY,
    letterSpacing: 0.5,
    lineHeight: 20,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: UI_COLORS.LIGHT_GRAY,
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
    color: UI_COLORS.BLACK,
    letterSpacing: 2,
    marginBottom: 4,
  },
  infoMeta: {
    fontSize: 10,
    color: UI_COLORS.MID_GRAY,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: UI_COLORS.LIGHT_GRAY,
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
    color: UI_COLORS.BLACK,
    letterSpacing: 1,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: UI_COLORS.MID_GRAY,
    letterSpacing: 0.5,
  },
  faqItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: UI_COLORS.LIGHT_GRAY,
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
    color: UI_COLORS.BLACK,
    letterSpacing: 0.5,
    marginRight: 8,
  },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: UI_COLORS.LIGHT_GRAY,
  },
  faqAnswerText: {
    fontSize: 11,
    color: UI_COLORS.MID_GRAY,
    letterSpacing: 0.5,
    lineHeight: 18,
  },
});
