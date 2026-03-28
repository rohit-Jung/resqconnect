import { z } from 'zod';

import { logger } from '@/config';
import { ServiceTypeEnum } from '@/constants';

export interface ParsedSMSEmergency {
  emergencyType: ServiceTypeEnum;
  location: {
    latitude: number;
    longitude: number;
  };
  userId?: string;
  userName?: string;
  userPhone?: string;
  description?: string;
  timestamp?: Date;
}

export interface SMSParseResult {
  success: boolean;
  data?: ParsedSMSEmergency;
  error?: string;
  rawMessage?: string;
}

const EMERGENCY_TYPE_MAP: Record<string, ServiceTypeEnum> = {
  medical: ServiceTypeEnum.AMBULANCE,
  ambulance: ServiceTypeEnum.AMBULANCE,
  police: ServiceTypeEnum.POLICE,
  fire: ServiceTypeEnum.FIRE_TRUCK,
  fire_truck: ServiceTypeEnum.FIRE_TRUCK,
  rescue: ServiceTypeEnum.RESCUE_TEAM,
  rescue_team: ServiceTypeEnum.RESCUE_TEAM,
};

const parsedSMSSchema = z.object({
  emergencyType: z.nativeEnum(ServiceTypeEnum),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  userId: z.string().uuid().optional(),
  userName: z.string().optional(),
  userPhone: z.string().optional(),
  description: z.string().optional(),
  timestamp: z.date().optional(),
});

function extractField(text: string, fieldName: string): string | undefined {
  // Case-insensitive match for field name followed by colon and value
  const regex = new RegExp(`${fieldName}\\s*:\\s*(.+?)(?=\\n|$)`, 'i');
  const match = text.match(regex);
  return match?.[1]?.trim();
}

/**
 * Parse location from SMS text
 * Supports formats:
 * - "Location: 28.123456, 77.123456"
 * - "Location: 28.123456,77.123456"
 * - "Lat: 28.123456, Lng: 77.123456"
 */
function parseLocation(
  text: string
): { latitude: number; longitude: number } | null {
  // Try "Location: lat, lng" format
  const locationField = extractField(text, 'Location');
  if (locationField) {
    const coords = locationField.split(',').map(s => s.trim());
    if (coords.length === 2) {
      const lat = parseFloat(coords[0]!);
      const lng = parseFloat(coords[1]!);
      if (!isNaN(lat) && !isNaN(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  }

  // Try separate Lat/Lng fields
  const latField = extractField(text, 'Lat');
  const lngField = extractField(text, 'Lng');
  if (latField && lngField) {
    const lat = parseFloat(latField);
    const lng = parseFloat(lngField);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  // Try to extract from Google Maps URL
  const mapsMatch = text.match(
    /maps\.google\.com\/?\?q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/i
  );
  if (mapsMatch) {
    const lat = parseFloat(mapsMatch[1]!);
    const lng = parseFloat(mapsMatch[2]!);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { latitude: lat, longitude: lng };
    }
  }

  return null;
}

function parseEmergencyType(
  text: string
): ParsedSMSEmergency['emergencyType'] | null {
  const typeField = extractField(text, 'Type');
  if (typeField) {
    const normalized = typeField.toLowerCase().trim();
    return EMERGENCY_TYPE_MAP[normalized] || null;
  }

  // Check for keywords in the message body
  const lowerText = text.toLowerCase();
  if (lowerText.includes('medical') || lowerText.includes('ambulance')) {
    return ServiceTypeEnum.AMBULANCE;
  }
  if (lowerText.includes('police')) {
    return ServiceTypeEnum.POLICE;
  }
  if (lowerText.includes('fire')) {
    return ServiceTypeEnum.FIRE_TRUCK;
  }
  if (lowerText.includes('rescue')) {
    return ServiceTypeEnum.RESCUE_TEAM;
  }

  return null;
}

function parseTimestamp(text: string): Date | undefined {
  const sentField = extractField(text, 'Sent');
  if (sentField) {
    const date = new Date(sentField);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return undefined;
}

function isEmergencySMS(text: string): boolean {
  // Check for our app's emergency header
  return (
    text.includes('EMERGENCY]') ||
    text.includes('ResQ Connect') ||
    text.includes('[ResQ')
  );
}

/**
 * Main SMS parser function
 * Parses incoming SMS text and extracts structured emergency data
 *
 * Expected SMS format:
 * [ResQ Connect EMERGENCY]
 * Type: MEDICAL
 * Location: 28.123456, 77.123456
 * Maps: https://maps.google.com/?q=28.123456,77.123456
 * UserID: uuid-here (optional)
 * User: John Doe (optional)
 * Phone: +919876543210 (optional)
 * Details: Need help (optional)
 * Sent: 3/21/2026, 10:30:00 AM (optional)
 */
export function parseSMSMessage(messageBody: string): SMSParseResult {
  try {
    // Check if this is a valid emergency SMS
    if (!isEmergencySMS(messageBody)) {
      return {
        success: false,
        error: 'Not a valid emergency SMS format',
        rawMessage: messageBody,
      };
    }

    // Parse location (required)
    const location = parseLocation(messageBody);
    if (!location) {
      return {
        success: false,
        error: 'Could not parse location from SMS',
        rawMessage: messageBody,
      };
    }

    // Parse emergency type (required)
    const emergencyType = parseEmergencyType(messageBody);
    if (!emergencyType) {
      return {
        success: false,
        error: 'Could not parse emergency type from SMS',
        rawMessage: messageBody,
      };
    }

    // Parse optional fields
    const userId = extractField(messageBody, 'UserID');
    const userName = extractField(messageBody, 'User');
    const userPhone = extractField(messageBody, 'Phone');
    const description = extractField(messageBody, 'Details');
    const timestamp = parseTimestamp(messageBody);

    const parsedData: ParsedSMSEmergency = {
      emergencyType,
      location,
      userId,
      userName,
      userPhone,
      description,
      timestamp,
    };

    // Validate with zod schema
    const validation = parsedSMSSchema.safeParse(parsedData);
    if (!validation.success) {
      const errors = validation.error.issues;
      logger.warn('SMS validation failed:', errors);
      return {
        success: false,
        error: `Validation failed: ${errors.map((e: z.ZodIssue) => e.message).join(', ')}`,
        rawMessage: messageBody,
      };
    }

    return {
      success: true,
      data: validation.data as ParsedSMSEmergency,
      rawMessage: messageBody,
    };
  } catch (error) {
    logger.error('SMS parsing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error',
      rawMessage: messageBody,
    };
  }
}

export const SMS_TEMPLATES = {
  REQUEST_RECEIVED: (requestId: string, emergencyType: string) =>
    `[ResQ Connect] Your ${emergencyType} emergency request has been received. Request ID: ${requestId.slice(0, 8)}. Help is being dispatched.`,

  PROVIDER_ASSIGNED: (emergencyType: string, providerName: string) =>
    `[ResQ Connect] A ${emergencyType} service provider (${providerName}) has been assigned to your request. They are on their way!`,

  USER_NOT_FOUND: (emergencyNumber: string) =>
    `[ResQ Connect] Your phone number is not registered. Please register in the app or call emergency services at ${emergencyNumber}.`,

  REQUEST_FAILED: (reason: string, emergencyNumber: string) =>
    `[ResQ Connect] We couldn't process your request: ${reason}. Please call emergency services at ${emergencyNumber}.`,

  NO_PROVIDERS_AVAILABLE: (emergencyNumber: string) =>
    `[ResQ Connect] No service providers are currently available in your area. Please call emergency services at ${emergencyNumber}.`,

  REQUEST_COMPLETED: () =>
    `[ResQ Connect] Your emergency request has been marked as completed. Thank you for using ResQ Connect.`,
};

export default {
  parseSMSMessage,
  SMS_TEMPLATES,
};
