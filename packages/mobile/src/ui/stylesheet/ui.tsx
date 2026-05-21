import { StyleSheet } from 'react-native';

import { UI_COLORS } from '../constants';

export const headerStyles = StyleSheet.create({
  container: {
    backgroundColor: UI_COLORS.OFF_WHITE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_COLORS.OFF_WHITE,
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: UI_COLORS.LIGHT_GRAY,
  },
  backButton: {
    padding: 10,
    backgroundColor: UI_COLORS.SIGNAL_RED,
    marginRight: 16,
  },
  backButtonPlaceholder: {
    width: 44,
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
  rightButton: {
    padding: 10,
  },
  rightButtonPlaceholder: {
    width: 44,
  },
});
