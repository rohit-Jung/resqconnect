import { APP_NAME, SMS_FALLBACK_NUMBER } from '@/constants';

export interface EmergencyLocation {
  latitude: number;
  longitude: number;
}

export interface SMSEmergencyData {
  emergencyType: string;
  location: EmergencyLocation;
  description?: string;
  userName?: string;
  userPhone?: string;
}

/**
 * Format emergency type for display
 */
export const formatEmergencyType = (type: string): string => {
  const types: Record<string, string> = {
    ambulance: 'MEDICAL',
    police: 'POLICE',
    fire_truck: 'FIRE',
    rescue_team: 'RESCUE',
  };
  return types[type] || type.toUpperCase();
};

/**
 * Generate Google Maps link from coordinates
 */
export const getGoogleMapsLink = (lat: number, lng: number): string => {
  return `https://maps.google.com/?q=${lat},${lng}`;
};

/**
 * Format emergency message for SMS
 */
export const formatEmergencyMessage = (data: SMSEmergencyData): string => {
  const { emergencyType, location, description, userName, userPhone } = data;

  const parts = [
    `[${APP_NAME} EMERGENCY]`,
    `Type: ${formatEmergencyType(emergencyType)}`,
    `Location: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
    `Maps: ${getGoogleMapsLink(location.latitude, location.longitude)}`,
  ];

  if (userName) {
    parts.push(`User: ${userName}`);
  }

  if (userPhone) {
    parts.push(`Phone: ${userPhone}`);
  }

  if (description && description.trim()) {
    parts.push(`Details: ${description.trim()}`);
  }

  parts.push(`Sent: ${new Date().toLocaleString()}`);

  return parts.join('\n');
};

/**
 * Format a brief emergency message for sharing with contacts
 */
export const formatShareMessage = (data: SMSEmergencyData): string => {
  const { emergencyType, location, userName } = data;

  return [
    `I need help! This is an emergency.`,
    `Type: ${formatEmergencyType(emergencyType)}`,
    `My location: ${getGoogleMapsLink(location.latitude, location.longitude)}`,
    userName ? `From: ${userName}` : '',
    `Sent via ${APP_NAME}`,
  ]
    .filter(Boolean)
    .join('\n');
};

/**
 * Get SMS fallback number
 */
export const getSMSFallbackNumber = (): string => {
  return SMS_FALLBACK_NUMBER;
};

/**
 * Validate phone number format (basic validation)
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

export default {
  formatEmergencyMessage,
  formatShareMessage,
  getGoogleMapsLink,
  formatEmergencyType,
  getSMSFallbackNumber,
  isValidPhoneNumber,
  formatPhoneNumber,
};
