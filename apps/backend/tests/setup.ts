import type * as models from '@repo/db/schemas';

import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { Mock } from 'vitest';
import { vi } from 'vitest';
import { type DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended';

export type MockDb = DeepMockProxy<NodePgDatabase<typeof models>>;

export const mockDb = mockDeep<NodePgDatabase<typeof models>>();

vi.mock('@/config', () => ({
  envConfig: {
    port: 3000,
    dev_ip: '0.0.0.0',
    allowed_origins: ['*'],
    database_url: 'postgresql://test:test@localhost:5432/test',
    jwt_secret: 'test-jwt-secret',
    jwt_expiry: 3600,
    jwt_restricted_expiry: 900,
    otp_secret: 'test-otp-secret',

    twilio_account_sid: 'AC00000000000000000000000000000000',
    twilio_auth_token: 'test-twilio-token',
    twilio_from_number: '+1234567890',

    galli_maps_token: 'test-galli-token',
    mailtrap_user: 'test-mailtrap-user',
    mailtrap_pass: 'test-mailtrap-pass',
    mapbox_token: 'test-mapbox-token',

    google_mail: 'test@gmail.com',
    google_pass: 'test-google-pass',
    to_number: '+1234567890',
    emergency_phone_number: '112',

    khalti_secret_key: 'test-khalti-secret',
    khalti_base_url: 'https://dev.khalti.com/api/v2',
    khalti_return_url: 'http://localhost:3000/return',
    khalti_website_url: 'http://localhost:3000',

    sms_uri_base: 'http://localhost:1401',
    sms_username: 'test-sms-user',
    sms_password: 'test-sms-pass',
    backend_base_path: 'http://localhost:3000',

    cloudinary_cloud_name: undefined,
    cloudinary_api_key: undefined,
    cloudinary_api_secret: undefined,

    // Infra
    redis_host: 'localhost',
    redis_port: 6379,
    kafka_brokers: 'localhost:9092',
    internal_api_key: 'test-internal-key',
  },
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    http: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
  },
  morganMiddleware: vi.fn((_req: unknown, _res: unknown, next: () => void) =>
    next()
  ),
  corsOptions: {
    origin: '*',
    credentials: true,
  },
}));

// Some modules import envConfig directly from this file path; mock it too.
vi.mock('@/config/env.config', () => ({
  envConfig: {
    port: 3000,
    dev_ip: '0.0.0.0',
    allowed_origins: ['*'],
    database_url: 'postgresql://test:test@localhost:5432/test',
    jwt_secret: 'test-jwt-secret',
    jwt_expiry: 3600,
    jwt_restricted_expiry: 900,
    otp_secret: 'test-otp-secret',
    twilio_account_sid: 'AC00000000000000000000000000000000',
    twilio_auth_token: 'test-twilio-token',
    twilio_from_number: '+1234567890',
    galli_maps_token: 'test-galli-token',
    mailtrap_user: 'test-mailtrap-user',
    mailtrap_pass: 'test-mailtrap-pass',
    google_mail: 'test@gmail.com',
    google_pass: 'test-google-pass',
    mapbox_token: 'test-mapbox-token',
    to_number: '+1234567890',
    emergency_phone_number: '112',
    khalti_secret_key: 'test-khalti-secret',
    khalti_base_url: 'https://dev.khalti.com/api/v2',
    khalti_return_url: 'http://localhost:3000/return',
    khalti_website_url: 'http://localhost:3000',
    sms_uri_base: 'http://localhost:1401',
    sms_username: 'test-sms-user',
    sms_password: 'test-sms-pass',
    backend_base_path: 'http://localhost:3000',
    cloudinary_cloud_name: undefined,
    cloudinary_api_key: undefined,
    cloudinary_api_secret: undefined,

    // Infra
    redis_host: 'localhost',
    redis_port: 6379,
    kafka_brokers: 'localhost:9092',
    internal_api_key: 'test-internal-key',
  },
}));

vi.mock('@/db', () => ({
  default: mockDb,
}));

vi.mock('@/services/redis.service', () => ({
  redis: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    incr: vi.fn().mockResolvedValue(1),
    incrby: vi.fn().mockResolvedValue(1),
    decr: vi.fn().mockResolvedValue(1),
    pexpire: vi.fn().mockResolvedValue(1),
    pttl: vi.fn().mockResolvedValue(15 * 60 * 1000),
    expire: vi.fn().mockResolvedValue(1),
    eval: vi.fn().mockResolvedValue([1, 1]),
  },
  acquireLock: vi.fn().mockResolvedValue(true),
  releaseLock: vi.fn().mockResolvedValue(true),
  getEmergencyProviders: vi.fn().mockResolvedValue([]),
  clearEmergencyProviders: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/socket', () => ({
  getIo: vi.fn().mockReturnValue({
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
    in: vi.fn().mockReturnValue({
      socketsJoin: vi.fn(),
    }),
  }),
}));

vi.mock('@/services/kafka/kafka.utils', () => ({
  publishWithRetry: vi.fn().mockResolvedValue(true),
}));

export const resetMocks = () => {
  mockReset(mockDb);
};

export interface MockRequest {
  body: Record<string, unknown>;
  params: Record<string, unknown>;
  query: Record<string, unknown>;
  user: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    phoneNumber?: string;
    currentLocation?: { latitude: string; longitude: string };
  } | null;
  cookies: Record<string, unknown>;
  files?: Record<string, { path: string }[]>;
}

export interface MockResponse {
  status: Mock<(code: number) => MockResponse>;
  json: Mock<(data: unknown) => MockResponse>;
  cookie: Mock<
    (name: string, value: string, options?: unknown) => MockResponse
  >;
  clearCookie: Mock<(name: string) => MockResponse>;
  statusCode?: number;
  data?: unknown;
}

export const createMockRequest = (
  overrides: Partial<MockRequest> = {}
): MockRequest => ({
  body: {},
  params: {},
  query: {},
  user: null,
  cookies: {},
  files: undefined,
  ...overrides,
});

export const createMockResponse = (): MockResponse => {
  const res = {} as MockResponse;
  res.status = vi.fn((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json = vi.fn((data: unknown) => {
    res.data = data;
    return res;
  });
  res.cookie = vi.fn(
    (_name: string, _value: string, _options?: unknown) => res
  );
  res.clearCookie = vi.fn((_name: string) => res);
  return res;
};

export const createMockNext = () => vi.fn((_error?: unknown) => {});

export const testUsers = {
  validUser: {
    id: 'test-user-id-123',
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'Password123!',
    phoneNumber: '9841234567',
    age: 25,
    primaryAddress: 'Kathmandu, Nepal',
    role: 'user' as const,
    isVerified: true,
  },
  adminUser: {
    id: 'test-admin-id-123',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    phoneNumber: '9841234568',
    role: 'admin' as const,
    isVerified: true,
  },
  unverifiedUser: {
    id: 'test-unverified-id-123',
    name: 'Unverified User',
    email: 'unverified@example.com',
    password: 'Password123!',
    phoneNumber: '9841234569',
    isVerified: false,
    verificationToken: '123456',
    tokenExpiry: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  },
};

export const testOrganizations = {
  validOrg: {
    id: 'test-org-id-123',
    name: 'Test Hospital',
    email: 'hospital@example.com',
    password: 'OrgPass123!',
    serviceCategory: 'ambulance' as const,
    generalNumber: '01-4123456',
    isVerified: true,
  },
  unverifiedOrg: {
    id: 'test-org-unverified-123',
    name: 'Unverified Hospital',
    email: 'unverified-hospital@example.com',
    password: 'OrgPass123!',
    serviceCategory: 'ambulance' as const,
    generalNumber: '01-4123457',
    isVerified: false,
  },
};

export const testServiceProviders = {
  validProvider: {
    id: 'test-provider-id-123',
    name: 'Test Ambulance Driver',
    email: 'driver@example.com',
    password: 'DriverPass123!',
    phoneNumber: '9841234570',
    age: 30,
    serviceType: 'ambulance' as const,
    serviceStatus: 'available' as const,
    organizationId: 'test-org-id-123',
    isVerified: true,
    currentLocation: { latitude: '27.7172', longitude: '85.3240' },
  },
  assignedProvider: {
    id: 'test-provider-assigned-123',
    name: 'Assigned Driver',
    email: 'assigned@example.com',
    phoneNumber: '9841234571',
    serviceType: 'ambulance' as const,
    serviceStatus: 'assigned' as const,
    organizationId: 'test-org-id-123',
    isVerified: true,
  },
};

export const testEmergencyRequests = {
  pendingRequest: {
    id: 'test-request-pending-123',
    userId: 'test-user-id-123',
    serviceType: 'ambulance' as const,
    description: 'Medical emergency - chest pain',
    location: { latitude: 27.7172, longitude: 85.324 },
    requestStatus: 'pending' as const,
    createdAt: new Date().toISOString(),
  },
  assignedRequest: {
    id: 'test-request-assigned-123',
    userId: 'test-user-id-123',
    serviceType: 'ambulance' as const,
    description: 'Accident emergency',
    location: { latitude: 27.7172, longitude: 85.324 },
    requestStatus: 'assigned' as const,
    createdAt: new Date().toISOString(),
  },
  cancelledRequest: {
    id: 'test-request-cancelled-123',
    userId: 'test-user-id-123',
    serviceType: 'ambulance' as const,
    description: 'Cancelled emergency',
    location: { latitude: 27.7172, longitude: 85.324 },
    requestStatus: 'cancelled' as const,
  },
};

export const testEmergencyContacts = {
  validContact: {
    id: 'test-contact-id-123',
    userId: 'test-user-id-123',
    name: 'Emergency Contact',
    phoneNumber: '9841234572',
    relationship: 'spouse',
    email: 'contact@example.com',
    notifyOnEmergency: true,
    notificationMethod: 'sms' as const,
  },
};

export const testFeedback = {
  validFeedback: {
    id: 'test-feedback-id-123',
    userId: 'test-user-id-123',
    serviceProviderId: 'test-provider-id-123',
    message: 'Great service, arrived quickly!',
    serviceRatings: 5,
    createdAt: new Date().toISOString(),
  },
};

export const testLocations = {
  kathmandu: { latitude: 27.7172, longitude: 85.324 },
  kathmanduString: { latitude: '27.7172', longitude: '85.3240' },
  bhaktapur: { latitude: 27.6722, longitude: 85.4298 },
  lalitpur: { latitude: 27.6588, longitude: 85.3247 },
};

export const getResponseData = (mockRes: MockResponse) => {
  if (mockRes.json.mock.calls.length > 0) {
    return (mockRes.json.mock.calls[0] as unknown[])?.[0] ?? null;
  }
  return null;
};

export const getStatusCode = (mockRes: MockResponse) => {
  if (mockRes.status.mock.calls.length > 0) {
    return (mockRes.status.mock.calls[0] as unknown[])?.[0] ?? null;
  }
  return null;
};

export const assertApiResponse = (
  response: { statusCode?: number; message?: string } | null,
  expectedStatus: number,
  expectedMessageContains?: string
) => {
  if (!response) {
    throw new Error('Response is null or undefined');
  }

  if (response.statusCode !== expectedStatus) {
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.statusCode}`
    );
  }

  if (
    expectedMessageContains &&
    !response.message?.includes(expectedMessageContains)
  ) {
    throw new Error(
      `Expected message to contain "${expectedMessageContains}", got "${response.message}"`
    );
  }
};

export const generateRandomEmail = () =>
  `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;

export const generateRandomPhone = () =>
  `98${Math.floor(10000000 + Math.random() * 90000000)}`;

export const generateRandomId = () =>
  `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
