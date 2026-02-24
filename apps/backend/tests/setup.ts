/**
 * Test Setup and Utilities
 * Provides mock functions, helper utilities, and common test fixtures
 */
import { mock } from 'bun:test';

//  Mock Request/Response Factory
export interface MockRequest {
  body: Record<string, any>;
  params: Record<string, any>;
  query: Record<string, any>;
  user: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    phoneNumber?: string;
    currentLocation?: { latitude: string; longitude: string };
  } | null;
  cookies: Record<string, any>;
}

export interface MockResponse {
  status: ReturnType<typeof mock>;
  json: ReturnType<typeof mock>;
  cookie: ReturnType<typeof mock>;
  clearCookie: ReturnType<typeof mock>;
  statusCode?: number;
  data?: any;
}

export const createMockRequest = (
  overrides: Partial<MockRequest> = {}
): MockRequest => ({
  body: {},
  params: {},
  query: {},
  user: null,
  cookies: {},
  ...overrides,
});

export const createMockResponse = (): MockResponse => {
  const res: MockResponse = {
    status: mock((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: mock((data: any) => {
      res.data = data;
      return res;
    }),
    cookie: mock((name: string, value: string) => res),
    clearCookie: mock((name: string) => res),
  };
  return res;
};

export const createMockNext = () => mock((error?: any) => {});

// Test Fixtures
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

/**
 * Extract response data from mock response
 */
export const getResponseData = (mockRes: MockResponse) => {
  if (mockRes.json.mock.calls.length > 0) {
    return mockRes.json?.mock?.calls[0][0] || {};
  }
  return null;
};

/**
 * Get status code from mock response
 */
export const getStatusCode = (mockRes: MockResponse) => {
  if (mockRes.status.mock.calls.length > 0) {
    return mockRes.status.mock.calls[0][0];
  }
  return null;
};

/**
 * Assert API response structure
 */
export const assertApiResponse = (
  response: any,
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

/**
 * Generate random test data
 */
export const generateRandomEmail = () =>
  `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;

export const generateRandomPhone = () =>
  `98${Math.floor(10000000 + Math.random() * 90000000)}`;

export const generateRandomId = () =>
  `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
