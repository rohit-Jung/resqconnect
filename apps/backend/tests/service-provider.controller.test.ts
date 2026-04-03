import { HttpStatusCode } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  changeProviderPassword,
  forgotServiceProviderPassword,
  getNearbyProviders,
  getServiceProvider,
  getServiceProviderProfile,
  loginServiceProvider,
  logoutServiceProvider,
  registerServiceProvider,
  resetServiceProviderPassword,
  updateServiceProvider,
  updateServiceProviderLocation,
  updateServiceProviderStatus,
  verifyServiceProvider,
} from '@/controllers/service-provider.controller';

import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  generateRandomEmail,
  generateRandomPhone,
  getResponseData,
  getStatusCode,
  testLocations,
  testOrganizations,
  testServiceProviders,
  testUsers,
} from './setup';

describe('Service Provider Controller Tests', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('registerServiceProvider', () => {
    it('should reject registration with missing required fields', async () => {
      mockReq.body = {
        name: 'Test Driver',
        email: generateRandomEmail(),
      };

      await registerServiceProvider(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject registration with invalid phone number', async () => {
      mockReq.body = {
        name: 'Test Driver',
        email: generateRandomEmail(),
        password: 'DriverPass123!',
        phoneNumber: '123',
        serviceType: 'ambulance',
        organizationId: testOrganizations.validOrg.id,
      };

      await registerServiceProvider(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect([HttpStatusCode.BadRequest, 400]).toContain(statusCode);
    });

    it('should reject registration with invalid service type', async () => {
      mockReq.body = {
        name: 'Test Driver',
        email: generateRandomEmail(),
        password: 'DriverPass123!',
        phoneNumber: generateRandomPhone(),
        serviceType: 'invalid-type',
        organizationId: testOrganizations.validOrg.id,
      };

      await registerServiceProvider(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it.todo('should successfully register with valid data');
    it.todo('should reject if organization does not exist');
    it.todo(
      'should reject if service type does not match organization category'
    );
    it.todo('should reject if provider already exists with same email/phone');
  });

  describe('loginServiceProvider', () => {
    it('should reject login with missing credentials', async () => {
      mockReq.body = {
        email: 'driver@example.com',
      };

      await loginServiceProvider(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject login with invalid email format', async () => {
      mockReq.body = {
        email: 'invalid-email',
        password: 'DriverPass123!',
      };

      await loginServiceProvider(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it.todo('should return OTP for unverified provider');
    it.todo('should return JWT token for verified provider');
    it.todo('should reject login with wrong password');
    it.todo('should reject login for non-existent provider');
  });

  describe('logoutServiceProvider', () => {
    it('should reject logout for unauthenticated provider', async () => {
      mockReq.user = null;

      await logoutServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it.todo('should successfully logout authenticated provider');
    it.todo('should clear authentication cookie');
  });

  describe('verifyServiceProvider', () => {
    it('should reject verification without OTP token', async () => {
      mockReq.body = {
        userId: 'test-provider-id',
      };

      await verifyServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject verification without provider ID', async () => {
      mockReq.body = {
        otpToken: '123456',
      };

      await verifyServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it.todo('should verify provider with correct OTP');
    it.todo('should reject expired OTP');
    it.todo('should reject invalid OTP');
  });

  describe('updateServiceProvider', () => {
    it('should reject update for unauthenticated provider', async () => {
      mockReq.user = null;
      mockReq.body = { name: 'New Name' };

      await updateServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject update with empty body', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {};

      await updateServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it.todo('should reject update with invalid fields');
    it.todo('should successfully update valid fields');
    it.todo('should not expose password in response');
  });

  describe('forgotServiceProviderPassword', () => {
    it('should reject request without phone number', async () => {
      mockReq.body = {};

      await forgotServiceProviderPassword(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it.todo('should send OTP for valid phone number');
    it.todo('should reject for non-existent provider');
  });

  describe('resetServiceProviderPassword', () => {
    it('should reject without OTP token', async () => {
      mockReq.body = {
        serviceProviderId: 'test-provider-id',
        password: 'NewPass123!',
      };

      await resetServiceProviderPassword(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject without provider ID', async () => {
      mockReq.body = {
        otpToken: '123456',
        password: 'NewPass123!',
      };

      await resetServiceProviderPassword(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject without new password', async () => {
      mockReq.body = {
        otpToken: '123456',
        serviceProviderId: 'test-provider-id',
      };

      await resetServiceProviderPassword(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it.todo('should reset password with valid OTP');
  });

  describe('changeProviderPassword', () => {
    it('should reject for unauthenticated provider', async () => {
      mockReq.user = null;
      mockReq.body = {
        oldPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
      };

      await changeProviderPassword(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject without old password', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {
        newPassword: 'NewPass123!',
      };

      await changeProviderPassword(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject without new password', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {
        oldPassword: 'OldPass123!',
      };

      await changeProviderPassword(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it.todo('should change password with correct old password');
    it.todo('should reject with wrong old password');
  });

  describe('getServiceProviderProfile', () => {
    it('should reject profile request for unauthenticated provider', async () => {
      mockReq.user = null;

      await getServiceProviderProfile(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it.todo('should return provider profile for authenticated provider');
  });

  describe('getServiceProvider', () => {
    it('should reject request from non-admin user', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: 'test-provider-id' };

      await getServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request without provider ID', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };
      mockReq.params = {};

      await getServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it.todo('should return provider for admin user');
    it.todo('should return 404 for non-existent provider');
  });

  describe('updateServiceProviderStatus', () => {
    it('should reject for unauthenticated provider', async () => {
      mockReq.user = null;
      mockReq.body = { status: 'available' };

      await updateServiceProviderStatus(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject without status', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {};

      await updateServiceProviderStatus(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it.todo('should update status to available');
    it.todo('should update status to unavailable');
    it.todo('should handle reassignment when provider goes off duty');
  });

  describe('updateServiceProviderLocation', () => {
    it('should reject for unauthenticated provider', async () => {
      mockReq.user = null;
      mockReq.body = {
        currentLocation: testLocations.kathmandu,
      };

      await updateServiceProviderLocation(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject without location data', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {};

      await updateServiceProviderLocation(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject with missing latitude', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {
        currentLocation: { longitude: 85.324 },
      };

      await updateServiceProviderLocation(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject with missing longitude', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {
        currentLocation: { latitude: 27.7172 },
      };

      await updateServiceProviderLocation(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject with invalid latitude (out of range)', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {
        currentLocation: { latitude: 100, longitude: 85.324 },
      };

      await updateServiceProviderLocation(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject with invalid longitude (out of range)', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {
        currentLocation: { latitude: 27.7172, longitude: 200 },
      };

      await updateServiceProviderLocation(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it.todo('should update location with valid coordinates');
    it.todo('should compute H3 index for location');
  });

  describe('getNearbyProviders', () => {
    it('should reject without latitude', async () => {
      mockReq.query = {
        longitude: '85.324',
        serviceType: 'ambulance',
      };

      await getNearbyProviders(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject without longitude', async () => {
      mockReq.query = {
        latitude: '27.7172',
        serviceType: 'ambulance',
      };

      await getNearbyProviders(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject without service type', async () => {
      mockReq.query = {
        latitude: '27.7172',
        longitude: '85.324',
      };

      await getNearbyProviders(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject with invalid service type', async () => {
      mockReq.query = {
        latitude: '27.7172',
        longitude: '85.324',
        serviceType: 'invalid-type',
      };

      await getNearbyProviders(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it.todo('should return nearby providers sorted by distance');
    it.todo('should only return available providers');
  });
});
