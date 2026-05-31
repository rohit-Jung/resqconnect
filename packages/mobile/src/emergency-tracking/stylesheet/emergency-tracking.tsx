import { StyleSheet } from 'react-native';

import { COLORS, MARKER_SIZES, UI_CONFIG } from '../constants';

export const emergencyTrackingHeaderStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.LIGHT_GRAY,
    backgroundColor: COLORS.OFF_WHITE,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  headerContent: {},
  brandRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  brandMark: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.BLACK,
    letterSpacing: 4,
  },
  brandDot: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.SIGNAL_RED,
    lineHeight: 26,
  },
  headerLine: {
    width: 30,
    height: 2,
    backgroundColor: COLORS.SIGNAL_RED,
    marginTop: 4,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 9,
    fontWeight: '500',
    color: COLORS.MID_GRAY,
    letterSpacing: 2,
  },
});

export const emergencyTrackingMapStyles = StyleSheet.create({
  map: {
    flex: 1,
  },
  userMarker: {
    ...MARKER_SIZES.USER_MARKER,
    backgroundColor: COLORS.OFF_WHITE,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: UI_CONFIG.SHADOW_OFFSET,
    shadowOpacity: UI_CONFIG.SHADOW_OPACITY,
    shadowRadius: UI_CONFIG.SHADOW_RADIUS,
    elevation: UI_CONFIG.ELEVATION,
  },
  providerMarker: {
    ...MARKER_SIZES.PROVIDER_MARKER,
    backgroundColor: COLORS.MID_GRAY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignedProviderMarker: {
    ...MARKER_SIZES.ASSIGNED_PROVIDER_MARKER,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: UI_CONFIG.SHADOW_OFFSET,
    shadowOpacity: UI_CONFIG.SHADOW_OPACITY,
    shadowRadius: UI_CONFIG.SHADOW_RADIUS,
    elevation: UI_CONFIG.ELEVATION,
  },
});

export const emergencyTrackingStatusCardUserStyles = StyleSheet.create({
  statusCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.OFF_WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT_GRAY,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
  },
  statusCardPending: {
    paddingBottom: 20,
  },

  // top row: badge + live pill
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  typeBadgeText: {
    color: COLORS.OFF_WHITE,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 5,
    letterSpacing: 1.5,
  },
  connectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  connectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  connectionText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.MID_GRAY,
    letterSpacing: 1.5,
  },

  // pending state
  pendingBody: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
  },
  pulseWrapper: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  pulseRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    opacity: 0.4,
  },
  pulseIconCenter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  providersChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  providersChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.GREEN,
    letterSpacing: 1.5,
  },

  // accepted / in_progress status row
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },

  // route info
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.LIGHT_GRAY,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 16,
  },
  routeInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeInfoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.BLACK,
    letterSpacing: 0.5,
  },
  routeInfoLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.MID_GRAY,
    letterSpacing: 1,
  },
  routeInfoDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#D1CFC8',
  },

  // provider card
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.LIGHT_GRAY,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 10,
  },
  providerAvatar: {
    width: 34,
    height: 34,
    backgroundColor: COLORS.BLACK,
    justifyContent: 'center',
    alignItems: 'center',
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.BLACK,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  providerVehicle: {
    fontSize: 10,
    color: COLORS.MID_GRAY,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  callBtn: {
    width: 36,
    height: 36,
    backgroundColor: COLORS.GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // location strip
  locationStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  locationStripText: {
    flex: 1,
  },
  locationAddressText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.BLACK,
    lineHeight: 16,
  },
  locationCoordsText: {
    fontSize: 10,
    color: COLORS.MID_GRAY,
    letterSpacing: 0.3,
    marginTop: 1,
  },

  // cancel
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: COLORS.SIGNAL_RED,
    gap: 6,
  },
  cancelButtonText: {
    color: COLORS.SIGNAL_RED,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  // kept for provider card (unused in user card now)
  confirmArrivalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: COLORS.SIGNAL_RED,
    marginBottom: 8,
  },
  confirmArrivalButtonText: {
    color: COLORS.OFF_WHITE,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export const emergencyTrackingStatusCardProviderStyles = StyleSheet.create({
  statusCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.OFF_WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.LIGHT_GRAY,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    maxHeight: '40%',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.BLACK,
    marginBottom: 10,
  },
  typeBadgeText: {
    color: COLORS.OFF_WHITE,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  roleBadgeText: {
    color: COLORS.OFF_WHITE,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 1,
    color: COLORS.BLACK,
    textTransform: 'uppercase',
  },
  routeInfoSwiss: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 16,
  },
  routeInfoSwissItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeInfoSwissText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.BLACK,
    marginLeft: 4,
    letterSpacing: 1,
  },
  routeInfoSwissDivider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  hairline: {
    height: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
    marginBottom: 10,
  },
  confirmArrivalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: COLORS.SIGNAL_RED,
    marginBottom: 8,
  },
  confirmArrivalButtonText: {
    color: COLORS.OFF_WHITE,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 10,
    color: COLORS.MID_GRAY,
    letterSpacing: 1,
  },
});
