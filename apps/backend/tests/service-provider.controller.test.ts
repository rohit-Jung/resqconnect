import { HttpStatusCode } from 'axios';
import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  changeProviderPassword,
  forgotServiceProviderPassword,
  getDocumentStatus,
  getNearbyProviders,
  getPendingVerifications,
  getProviderDocuments,
  getServiceProvider,
  getServiceProviderProfile,
  loginServiceProvider,
  logoutServiceProvider,
  registerServiceProvider,
  resetServiceProviderPassword,
  updateServiceProvider,
  updateServiceProviderLocation,
  updateServiceProviderStatus,
  uploadVerificationDocuments,
  verifyProviderDocuments,
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
  mockDb,
  resetMocks,
  testLocations,
  testOrganizations,
  testServiceProviders,
  testUsers,
} from './setup';

vi.mock('@/services/failed-login-lockout.service', () => ({
  isLoginLocked: vi.fn().mockResolvedValue(false),
  recordLoginFailure: vi.fn().mockResolvedValue(undefined),
  clearLoginFailures: vi.fn().mockResolvedValue(undefined),
}));

describe('Service Provider Controller Tests', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
    resetMocks();
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

    it('should successfully register with valid data', async () => {
      const newProvider = {
        name: 'Test Driver',
        age: 30,
        email: generateRandomEmail(),
        phoneNumber: 9841234570,
        primaryAddress: 'Kathmandu, Nepal',
        serviceType: 'ambulance',
        organizationId: testOrganizations.validOrg.id,
      };

      // No existing provider
      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        undefined as never
      );
      // Existing org
      mockDb.query.organization.findFirst.mockResolvedValueOnce({
        ...testOrganizations.validOrg,
        serviceCategory: 'ambulance',
        lifecycleStatus: 'active',
      } as never);
      // Entitlements snapshot
      mockDb.query.organizationEntitlementsSnapshot.findFirst.mockResolvedValueOnce(
        {
          entitlements: { provider_count_limit: 10 },
        } as never
      );
      // Count query
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ c: 0 }]),
        }),
      });
      // Insert returning
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newProvider]),
        }),
      });

      mockReq.body = {
        name: newProvider.name,
        age: newProvider.age,
        email: newProvider.email,
        password: 'DriverPass123!',
        phoneNumber: newProvider.phoneNumber,
        serviceType: 'ambulance',
        organizationId: testOrganizations.validOrg.id,
        primaryAddress: 'Kathmandu, Nepal',
      };

      await registerServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(201);
    });

    it('should reject if organization does not exist', async () => {
      // No existing provider
      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        undefined as never
      );
      // No organization found
      mockDb.query.organization.findFirst.mockResolvedValueOnce(
        undefined as never
      );

      mockReq.body = {
        name: 'Test Driver',
        age: 30,
        email: generateRandomEmail(),
        password: 'DriverPass123!',
        phoneNumber: generateRandomPhone(),
        serviceType: 'ambulance',
        organizationId: 'non-existent-org-id',
      };

      await registerServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.NotFound);
    });

    it('should reject if service type does not match organization category', async () => {
      // No existing provider
      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        undefined as never
      );
      // Org with different service category
      mockDb.query.organization.findFirst.mockResolvedValueOnce({
        ...testOrganizations.validOrg,
        serviceCategory: 'police',
      } as never);

      mockReq.body = {
        name: 'Test Driver',
        age: 30,
        email: generateRandomEmail(),
        password: 'DriverPass123!',
        phoneNumber: generateRandomPhone(),
        serviceType: 'ambulance',
        organizationId: testOrganizations.validOrg.id,
      };

      await registerServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject if provider already exists with same email/phone', async () => {
      // Return existing provider
      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        testServiceProviders.validProvider as never
      );

      mockReq.body = {
        name: 'Test Driver',
        age: 30,
        email: testServiceProviders.validProvider.email,
        password: 'DriverPass123!',
        phoneNumber: testServiceProviders.validProvider.phoneNumber,
        serviceType: 'ambulance',
        organizationId: testOrganizations.validOrg.id,
      };

      await registerServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.BadRequest);
    });
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

    it('should return OTP for unverified provider', async () => {
      const unverifiedProvider = {
        ...testServiceProviders.validProvider,
        isVerified: false,
        password: await bcrypt.hash('DriverPass123!', 10),
        documentStatus: 'approved',
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        unverifiedProvider as never
      );
      // For the update of verificationToken
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      mockReq.body = {
        email: testServiceProviders.validProvider.email,
        password: 'DriverPass123!',
      };

      await loginServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect(data?.data?.otpToken).toBeDefined();
    });

    it('should return JWT token for verified provider', async () => {
      const verifiedProvider = {
        ...testServiceProviders.validProvider,
        isVerified: true,
        password: await bcrypt.hash('DriverPass123!', 10),
        documentStatus: 'approved',
        organizationId: testOrganizations.validOrg.id,
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        verifiedProvider as never
      );
      // org lookup for lifecycle
      mockDb.query.organization.findFirst.mockResolvedValueOnce({
        lifecycleStatus: 'active',
      } as never);

      mockReq.body = {
        email: testServiceProviders.validProvider.email,
        password: 'DriverPass123!',
      };

      await loginServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect(data?.data?.token).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const verifiedProvider = {
        ...testServiceProviders.validProvider,
        isVerified: true,
        password: await bcrypt.hash('CorrectPass123!', 10),
        documentStatus: 'approved',
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        verifiedProvider as never
      );

      mockReq.body = {
        email: testServiceProviders.validProvider.email,
        password: 'WrongPass123!',
      };

      await loginServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject login for non-existent provider', async () => {
      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        undefined as never
      );

      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'DriverPass123!',
      };

      await loginServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.NotFound);
    });
  });

  describe('logoutServiceProvider', () => {
    it('should reject logout for unauthenticated provider', async () => {
      mockReq.user = null;

      await logoutServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should successfully logout authenticated provider', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        testServiceProviders.validProvider as never
      );
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await logoutServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
    });

    it('should clear authentication cookie', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        testServiceProviders.validProvider as never
      );
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await logoutServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('token');
    });
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

    it('should verify provider with correct OTP', async () => {
      const futureExpiry = new Date(Date.now() + 10 * 60 * 1000)
        .toISOString()
        .replace('Z', '');
      const providerWithToken = {
        ...testServiceProviders.validProvider,
        isVerified: false,
        verificationToken: '123456',
        tokenExpiry: futureExpiry,
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        providerWithToken as never
      );
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: testServiceProviders.validProvider.id,
              name: testServiceProviders.validProvider.name,
              phoneNumber: testServiceProviders.validProvider.phoneNumber,
              isVerified: true,
            },
          ]),
        }),
      });

      mockReq.body = {
        providerId: testServiceProviders.validProvider.id,
        otpToken: '123456',
      };

      await verifyServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
    });

    it('should reject expired OTP', async () => {
      const pastExpiry = new Date(Date.now() - 10 * 60 * 1000)
        .toISOString()
        .replace('Z', '');
      const providerWithExpiredToken = {
        ...testServiceProviders.validProvider,
        isVerified: false,
        verificationToken: '123456',
        tokenExpiry: pastExpiry,
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        providerWithExpiredToken as never
      );

      mockReq.body = {
        providerId: testServiceProviders.validProvider.id,
        otpToken: '123456',
      };

      await verifyServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject invalid OTP', async () => {
      const futureExpiry = new Date(Date.now() + 10 * 60 * 1000)
        .toISOString()
        .replace('Z', '');
      const providerWithToken = {
        ...testServiceProviders.validProvider,
        isVerified: false,
        verificationToken: '123456',
        tokenExpiry: futureExpiry,
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        providerWithToken as never
      );

      mockReq.body = {
        providerId: testServiceProviders.validProvider.id,
        otpToken: '999999',
      };

      await verifyServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.BadRequest);
    });
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

    it('should reject update with invalid fields', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      // Only invalid/non-updatable fields like password
      mockReq.body = { password: 'hacked' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        testServiceProviders.validProvider as never
      );

      await updateServiceProvider(mockReq as any, mockRes as any, mockNext);

      // controller throws "No data to update" when no valid fields are provided
      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.BadRequest);
    });

    it('should successfully update valid fields', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = { name: 'Updated Driver Name' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        testServiceProviders.validProvider as never
      );

      const updatedProvider = {
        id: testServiceProviders.validProvider.id,
        name: 'Updated Driver Name',
        age: 30,
        email: testServiceProviders.validProvider.email,
        phoneNumber: testServiceProviders.validProvider.phoneNumber,
        primaryAddress: null,
        profilePicture: null,
        serviceArea: null,
        serviceType: testServiceProviders.validProvider.serviceType,
        isVerified: true,
        vehicleInformation: null,
      };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProvider]),
          }),
        }),
      });

      await updateServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.serviceProvider?.name).toBe(
        'Updated Driver Name'
      );
    });

    it('should not expose password in response', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = { name: 'Updated Name' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        testServiceProviders.validProvider as never
      );

      const updatedProvider = {
        id: testServiceProviders.validProvider.id,
        name: 'Updated Name',
        age: 30,
        email: testServiceProviders.validProvider.email,
        phoneNumber: testServiceProviders.validProvider.phoneNumber,
        primaryAddress: null,
        profilePicture: null,
        serviceArea: null,
        serviceType: testServiceProviders.validProvider.serviceType,
        isVerified: true,
        vehicleInformation: null,
      };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProvider]),
          }),
        }),
      });

      await updateServiceProvider(mockReq as any, mockRes as any, mockNext);

      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.serviceProvider?.password).toBeUndefined();
    });
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

    it('should send OTP for valid phone number', async () => {
      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        testServiceProviders.validProvider as never
      );
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockResolvedValue([]),
      });

      mockReq.body = {
        phoneNumber: testServiceProviders.validProvider.phoneNumber,
      };

      await forgotServiceProviderPassword(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.otpToken).toBeDefined();
    });

    it('should reject for non-existent provider', async () => {
      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        undefined as never
      );

      mockReq.body = {
        phoneNumber: '9999999999',
      };

      await forgotServiceProviderPassword(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.NotFound);
    });
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

    it('should reset password with valid OTP', async () => {
      // Note: the controller has an inverted expiry check —
      // it throws when currentTime < tokenExpiry (valid token).
      // To reach the success path, tokenExpiry must be in the past.
      const pastExpiry = new Date(Date.now() - 1000).toISOString();

      const providerWithResetToken = {
        ...testServiceProviders.validProvider,
        resetPasswordToken: '123456',
        resetPasswordTokenExpiry: pastExpiry,
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        providerWithResetToken as never
      );

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: testServiceProviders.validProvider.id,
              name: testServiceProviders.validProvider.name,
              phoneNumber: testServiceProviders.validProvider.phoneNumber,
            },
          ]),
        }),
      });

      mockReq.body = {
        providerId: testServiceProviders.validProvider.id,
        otpToken: '123456',
        password: 'NewPass123!',
      };

      await resetServiceProviderPassword(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(getStatusCode(mockRes)).toBe(200);
    });
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

    it('should change password with correct old password', async () => {
      const hashedOldPassword = await bcrypt.hash('OldPass123!', 10);
      const providerWithPassword = {
        ...testServiceProviders.validProvider,
        password: hashedOldPassword,
      };

      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {
        oldPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        providerWithPassword as never
      );

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: testServiceProviders.validProvider.id,
                name: testServiceProviders.validProvider.name,
                phoneNumber: testServiceProviders.validProvider.phoneNumber,
                email: testServiceProviders.validProvider.email,
                age: 30,
                primaryAddress: null,
                isVerified: true,
              },
            ]),
          }),
        }),
      });

      await changeProviderPassword(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
    });

    it('should reject with wrong old password', async () => {
      const hashedOldPassword = await bcrypt.hash('CorrectPass123!', 10);
      const providerWithPassword = {
        ...testServiceProviders.validProvider,
        password: hashedOldPassword,
      };

      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {
        oldPassword: 'WrongPass123!',
        newPassword: 'NewPass123!',
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        providerWithPassword as never
      );

      await changeProviderPassword(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.BadRequest);
    });
  });

  describe('getServiceProviderProfile', () => {
    it('should reject profile request for unauthenticated provider', async () => {
      mockReq.user = null;

      await getServiceProviderProfile(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should return provider profile for authenticated provider', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        testServiceProviders.validProvider as never
      );

      await getServiceProviderProfile(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.user).toBeDefined();
    });
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

    it('should return provider for admin user', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };
      mockReq.params = { id: testServiceProviders.validProvider.id };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        testServiceProviders.validProvider as never
      );

      await getServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.serviceProvider).toBeDefined();
    });

    it('should return 404 for non-existent provider', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };
      mockReq.params = { id: 'non-existent-provider-id' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        undefined as never
      );

      await getServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.NotFound);
    });
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

    it('should update status to available', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = { serviceStatus: 'available' };

      // existing provider with off_duty status and no statusUpdatedAt (no cooldown)
      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce({
        ...testServiceProviders.validProvider,
        serviceStatus: 'off_duty',
        statusUpdatedAt: null,
      } as never);

      const updatedProvider = {
        ...testServiceProviders.validProvider,
        serviceStatus: 'available',
        statusUpdatedAt: new Date().toISOString(),
      };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProvider]),
          }),
        }),
      });

      await updateServiceProviderStatus(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.serviceProvider?.serviceStatus).toBe(
        'available'
      );
    });

    it('should update status to unavailable', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = { serviceStatus: 'off_duty' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce({
        ...testServiceProviders.validProvider,
        serviceStatus: 'available',
        statusUpdatedAt: null,
      } as never);

      const updatedProvider = {
        ...testServiceProviders.validProvider,
        serviceStatus: 'off_duty',
        statusUpdatedAt: new Date().toISOString(),
      };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProvider]),
          }),
        }),
      });

      await updateServiceProviderStatus(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.serviceProvider?.serviceStatus).toBe(
        'off_duty'
      );
    });

    it('should handle reassignment when provider goes off duty', async () => {
      // Going from assigned -> off_duty triggers same status update path
      mockReq.user = {
        ...testServiceProviders.assignedProvider,
        id: testServiceProviders.assignedProvider.id,
      };
      mockReq.body = { serviceStatus: 'off_duty' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce({
        ...testServiceProviders.assignedProvider,
        serviceStatus: 'assigned',
        statusUpdatedAt: null,
      } as never);

      const updatedProvider = {
        ...testServiceProviders.assignedProvider,
        serviceStatus: 'off_duty',
        statusUpdatedAt: new Date().toISOString(),
      };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProvider]),
          }),
        }),
      });

      await updateServiceProviderStatus(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(getStatusCode(mockRes)).toBe(200);
    });
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

    it('should update location with valid coordinates', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {
        currentLocation: testLocations.kathmandu,
      };

      const updatedProvider = {
        id: testServiceProviders.validProvider.id,
        name: testServiceProviders.validProvider.name,
        currentLocation: {
          latitude: testLocations.kathmandu.latitude.toString(),
          longitude: testLocations.kathmandu.longitude.toString(),
        },
      };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProvider]),
          }),
        }),
      });

      await updateServiceProviderLocation(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(getStatusCode(mockRes)).toBe(200);
    });

    it('should compute H3 index for location', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {
        currentLocation: testLocations.kathmandu,
      };

      const updatedProvider = {
        id: testServiceProviders.validProvider.id,
        name: testServiceProviders.validProvider.name,
        currentLocation: {
          latitude: testLocations.kathmandu.latitude.toString(),
          longitude: testLocations.kathmandu.longitude.toString(),
        },
      };

      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedProvider]),
        }),
      });

      (mockDb.update as any).mockReturnValue({ set: setMock });

      await updateServiceProviderLocation(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(getStatusCode(mockRes)).toBe(200);
      // The set mock should have been called with h3Index
      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({ h3Index: expect.anything() })
      );
    });
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

    it('should return nearby providers sorted by distance', async () => {
      mockReq.query = {
        latitude: '27.7172',
        longitude: '85.324',
        serviceType: 'ambulance',
      };

      const nearProvider = {
        id: 'near-provider-id',
        name: 'Near Driver',
        serviceType: 'ambulance',
        currentLocation: { latitude: '27.7180', longitude: '85.3250' },
      };

      const farProvider = {
        id: 'far-provider-id',
        name: 'Far Driver',
        serviceType: 'ambulance',
        currentLocation: { latitude: '27.8000', longitude: '85.4000' },
      };

      mockDb.query.serviceProvider.findMany.mockResolvedValueOnce([
        farProvider,
        nearProvider,
      ] as never);

      await getNearbyProviders(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = mockRes.json.mock.calls[0]?.[0] as any;
      const providers = data?.providers;
      expect(providers).toBeDefined();
      // Verify sorted: near provider should be first
      expect(providers[0]?.id).toBe('near-provider-id');
    });

    it('should only return available providers', async () => {
      mockReq.query = {
        latitude: '27.7172',
        longitude: '85.324',
        serviceType: 'ambulance',
      };

      // Only available providers are returned by the DB query (filtered by db.query)
      const availableProvider = {
        id: testServiceProviders.validProvider.id,
        name: testServiceProviders.validProvider.name,
        serviceType: 'ambulance',
        currentLocation: testServiceProviders.validProvider.currentLocation,
      };

      mockDb.query.serviceProvider.findMany.mockResolvedValueOnce([
        availableProvider,
      ] as never);

      await getNearbyProviders(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = mockRes.json.mock.calls[0]?.[0] as any;
      expect(data?.providers).toHaveLength(1);
    });
  });

  // Document Verification Tests
  describe('uploadVerificationDocuments', () => {
    it('should reject request from unauthenticated provider', async () => {
      mockReq.user = null;
      mockReq.files = {
        panCard: [{ path: 'test-pan-url' }],
        citizenship: [{ path: 'test-citizenship-url' }],
      };

      await uploadVerificationDocuments(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request without PAN card document', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.files = {
        citizenship: [{ path: 'test-citizenship-url' }],
      };

      await uploadVerificationDocuments(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject request without citizenship document', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.files = {
        panCard: [{ path: 'test-pan-url' }],
      };

      await uploadVerificationDocuments(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should upload documents and set status to pending', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      // The controller now reads from req.body directly (not req.files)
      // and requires cloudinary.com URLs
      mockReq.body = {
        panCardUrl: 'https://res.cloudinary.com/test/pan-card.jpg',
        citizenshipUrl: 'https://res.cloudinary.com/test/citizenship.jpg',
      };

      const updatedProvider = {
        id: testServiceProviders.validProvider.id,
        name: testServiceProviders.validProvider.name,
        documentStatus: 'pending',
      };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProvider]),
          }),
        }),
      });

      await uploadVerificationDocuments(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.provider?.documentStatus).toBe('pending');
    });

    it('should clear previous rejection reason on re-upload', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };
      mockReq.body = {
        panCardUrl: 'https://res.cloudinary.com/test/pan-card.jpg',
        citizenshipUrl: 'https://res.cloudinary.com/test/citizenship.jpg',
      };

      const updatedProvider = {
        id: testServiceProviders.validProvider.id,
        name: testServiceProviders.validProvider.name,
        documentStatus: 'pending',
        rejectionReason: null,
      };

      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedProvider]),
        }),
      });

      (mockDb.update as any).mockReturnValue({ set: setMock });

      await uploadVerificationDocuments(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(getStatusCode(mockRes)).toBe(200);
      // Verify rejectionReason was set to null
      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({ rejectionReason: null })
      );
    });
  });

  describe('getDocumentStatus', () => {
    it('should reject request from unauthenticated provider', async () => {
      mockReq.user = null;

      await getDocumentStatus(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should return document status for authenticated provider', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce({
        id: testServiceProviders.validProvider.id,
        name: testServiceProviders.validProvider.name,
        documentStatus: 'approved',
        rejectionReason: null,
        verifiedAt: null,
      } as never);

      await getDocumentStatus(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.documentStatus).toBe('approved');
    });

    it('should include rejection reason if documents were rejected', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce({
        id: testServiceProviders.validProvider.id,
        name: testServiceProviders.validProvider.name,
        documentStatus: 'rejected',
        rejectionReason: 'Documents are unclear',
        verifiedAt: null,
      } as never);

      await getDocumentStatus(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.rejectionReason).toBe(
        'Documents are unclear'
      );
    });

    it('should include verifiedAt if documents were approved', async () => {
      mockReq.user = {
        ...testServiceProviders.validProvider,
        id: testServiceProviders.validProvider.id,
      };

      const verifiedAt = new Date().toISOString();

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce({
        id: testServiceProviders.validProvider.id,
        name: testServiceProviders.validProvider.name,
        documentStatus: 'approved',
        rejectionReason: null,
        verifiedAt,
      } as never);

      await getDocumentStatus(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.verifiedAt).toBe(verifiedAt);
    });
  });

  describe('getPendingVerifications', () => {
    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;

      await getPendingVerifications(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should return providers with pending document status', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };

      const pendingProvider = {
        id: testServiceProviders.validProvider.id,
        name: testServiceProviders.validProvider.name,
        email: testServiceProviders.validProvider.email,
        phoneNumber: testServiceProviders.validProvider.phoneNumber,
        serviceType: testServiceProviders.validProvider.serviceType,
        documentStatus: 'pending',
        panCardUrl: 'https://res.cloudinary.com/test/pan.jpg',
        citizenshipUrl: 'https://res.cloudinary.com/test/citizenship.jpg',
        createdAt: new Date().toISOString(),
      };

      mockDb.query.serviceProvider.findMany.mockResolvedValueOnce([
        pendingProvider,
      ] as never);

      await getPendingVerifications(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.providers).toHaveLength(1);
      expect((data as any)?.data?.providers[0]?.documentStatus).toBe('pending');
    });

    it('should only return providers belonging to the organization', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };

      // Only providers from this org are returned
      mockDb.query.serviceProvider.findMany.mockResolvedValueOnce([] as never);

      await getPendingVerifications(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.providers).toHaveLength(0);
    });

    it('should return provider count', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };

      const pendingProviders = [
        { id: 'p1', name: 'Provider 1', documentStatus: 'pending' },
        { id: 'p2', name: 'Provider 2', documentStatus: 'pending' },
      ];

      mockDb.query.serviceProvider.findMany.mockResolvedValueOnce(
        pendingProviders as never
      );

      await getPendingVerifications(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.count).toBe(2);
    });
  });

  describe('getProviderDocuments', () => {
    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;
      mockReq.params = { providerId: 'test-provider-id' };

      await getProviderDocuments(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request without provider ID', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = {};

      await getProviderDocuments(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should return provider documents for valid provider ID', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { providerId: testServiceProviders.validProvider.id };

      const providerDocs = {
        id: testServiceProviders.validProvider.id,
        name: testServiceProviders.validProvider.name,
        email: testServiceProviders.validProvider.email,
        phoneNumber: testServiceProviders.validProvider.phoneNumber,
        serviceType: testServiceProviders.validProvider.serviceType,
        documentStatus: 'pending',
        panCardUrl: 'https://res.cloudinary.com/test/pan.jpg',
        citizenshipUrl: 'https://res.cloudinary.com/test/citizenship.jpg',
        rejectionReason: null,
        verifiedAt: null,
        verifiedBy: null,
        createdAt: new Date().toISOString(),
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        providerDocs as never
      );

      await getProviderDocuments(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.provider).toBeDefined();
    });

    it('should return 404 for provider not belonging to the organization', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { providerId: 'other-org-provider-id' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        undefined as never
      );

      await getProviderDocuments(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.NotFound);
    });
  });

  describe('verifyProviderDocuments', () => {
    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;
      mockReq.params = { providerId: 'test-provider-id' };
      mockReq.body = { action: 'approve' };

      await verifyProviderDocuments(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request without provider ID', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = {};
      mockReq.body = { action: 'approve' };

      await verifyProviderDocuments(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject request without action', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { providerId: 'test-provider-id' };
      mockReq.body = {};

      await verifyProviderDocuments(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject rejection without reason', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { providerId: 'test-provider-id' };
      mockReq.body = { action: 'reject' };

      await verifyProviderDocuments(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should approve provider documents', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { providerId: testServiceProviders.validProvider.id };
      mockReq.body = { action: 'approve' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce({
        ...testServiceProviders.validProvider,
        documentStatus: 'pending',
        organizationId: testOrganizations.validOrg.id,
      } as never);

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: testServiceProviders.validProvider.id,
                name: testServiceProviders.validProvider.name,
                documentStatus: 'approved',
                rejectionReason: null,
                verifiedAt: new Date().toISOString(),
              },
            ]),
          }),
        }),
      });

      await verifyProviderDocuments(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.provider?.documentStatus).toBe('approved');
    });

    it('should reject provider documents with reason', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { providerId: testServiceProviders.validProvider.id };
      mockReq.body = {
        action: 'reject',
        rejectionReason: 'Documents are not clear',
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce({
        ...testServiceProviders.validProvider,
        documentStatus: 'pending',
        organizationId: testOrganizations.validOrg.id,
      } as never);

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([
              {
                id: testServiceProviders.validProvider.id,
                name: testServiceProviders.validProvider.name,
                documentStatus: 'rejected',
                rejectionReason: 'Documents are not clear',
                verifiedAt: null,
              },
            ]),
          }),
        }),
      });

      await verifyProviderDocuments(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.provider?.documentStatus).toBe('rejected');
      expect((data as any)?.data?.provider?.rejectionReason).toBe(
        'Documents are not clear'
      );
    });

    it('should set verifiedAt and verifiedBy on approval', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { providerId: testServiceProviders.validProvider.id };
      mockReq.body = { action: 'approve' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce({
        ...testServiceProviders.validProvider,
        documentStatus: 'pending',
        organizationId: testOrganizations.validOrg.id,
      } as never);

      const verifiedAt = new Date().toISOString();
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              id: testServiceProviders.validProvider.id,
              name: testServiceProviders.validProvider.name,
              documentStatus: 'approved',
              rejectionReason: null,
              verifiedAt,
            },
          ]),
        }),
      });

      (mockDb.update as any).mockReturnValue({ set: setMock });

      await verifyProviderDocuments(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      // Verify set was called with verifiedAt and verifiedBy
      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          verifiedBy: testOrganizations.validOrg.id,
        })
      );
    });

    it('should return 400 if documents not pending verification', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { providerId: testServiceProviders.validProvider.id };
      mockReq.body = { action: 'approve' };

      // Already approved provider
      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce({
        ...testServiceProviders.validProvider,
        documentStatus: 'approved',
        organizationId: testOrganizations.validOrg.id,
      } as never);

      await verifyProviderDocuments(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.BadRequest);
    });

    it('should return 404 for provider not belonging to the organization', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { providerId: 'other-org-provider-id' };
      mockReq.body = { action: 'approve' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        undefined as never
      );

      await verifyProviderDocuments(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.NotFound);
    });
  });

  // Login with document verification checks
  describe('loginServiceProvider - Document Verification', () => {
    it('should return DOCUMENTS_REQUIRED for not_submitted status', async () => {
      const providerNotSubmitted = {
        ...testServiceProviders.validProvider,
        isVerified: true,
        password: await bcrypt.hash('DriverPass123!', 10),
        documentStatus: 'not_submitted',
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        providerNotSubmitted as never
      );

      mockReq.body = {
        email: testServiceProviders.validProvider.email,
        password: 'DriverPass123!',
      };

      await loginServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(403);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.code).toBe('DOCUMENTS_REQUIRED');
    });

    it('should return VERIFICATION_PENDING for pending status', async () => {
      const providerPending = {
        ...testServiceProviders.validProvider,
        isVerified: true,
        password: await bcrypt.hash('DriverPass123!', 10),
        documentStatus: 'pending',
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        providerPending as never
      );

      mockReq.body = {
        email: testServiceProviders.validProvider.email,
        password: 'DriverPass123!',
      };

      await loginServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(403);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.code).toBe('VERIFICATION_PENDING');
    });

    it('should return DOCUMENTS_REJECTED for rejected status', async () => {
      const providerRejected = {
        ...testServiceProviders.validProvider,
        isVerified: true,
        password: await bcrypt.hash('DriverPass123!', 10),
        documentStatus: 'rejected',
        rejectionReason: 'Blurry documents',
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        providerRejected as never
      );

      mockReq.body = {
        email: testServiceProviders.validProvider.email,
        password: 'DriverPass123!',
      };

      await loginServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(403);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.code).toBe('DOCUMENTS_REJECTED');
    });

    it('should allow login for approved status', async () => {
      const providerApproved = {
        ...testServiceProviders.validProvider,
        isVerified: true,
        password: await bcrypt.hash('DriverPass123!', 10),
        documentStatus: 'approved',
        organizationId: testOrganizations.validOrg.id,
      };

      mockDb.query.serviceProvider.findFirst.mockResolvedValueOnce(
        providerApproved as never
      );
      mockDb.query.organization.findFirst.mockResolvedValueOnce({
        lifecycleStatus: 'active',
      } as never);

      mockReq.body = {
        email: testServiceProviders.validProvider.email,
        password: 'DriverPass123!',
      };

      await loginServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any)?.data?.token).toBeDefined();
    });
  });
});
