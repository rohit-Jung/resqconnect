import { HttpStatusCode } from 'axios';
import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  deleteOrgServiceProvider,
  deleteOrganization,
  getAllOrganizations,
  getOrgProfile,
  getOrgServiceProviderById,
  getOrgServiceProviders,
  getOrganizationById,
  listOrganizationsPublic,
  loginOrganization,
  registerOrgServiceProvider,
  registerOrganization,
  updateOrgServiceProvider,
  updateOrganization,
  verifyOrgOTP,
  verifyOrgServiceProvider,
} from '@/controllers/organization.controller';

import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  generateRandomEmail,
  getResponseData,
  getStatusCode,
  mockDb,
  resetMocks,
  testOrganizations,
  testServiceProviders,
  testUsers,
} from './setup';

describe('Organization Controller Tests', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
    resetMocks();
  });

  describe('registerOrganization', () => {
    it('should reject registration with missing required fields', async () => {
      mockReq.body = {
        name: 'Test Hospital',
      };

      await registerOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject registration with invalid email format', async () => {
      mockReq.body = {
        name: 'Test Hospital',
        email: 'invalid-email',
        password: 'OrgPass123!',
        serviceCategory: 'ambulance',
        generalNumber: '01-4123456',
      };

      await registerOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject registration with invalid service category', async () => {
      mockReq.body = {
        name: 'Test Hospital',
        email: generateRandomEmail(),
        password: 'OrgPass123!',
        serviceCategory: 'invalid-category',
        generalNumber: '01-4123456',
      };

      await registerOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should successfully register organization with valid data', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };
      mockReq.body = {
        name: 'New Hospital',
        email: generateRandomEmail(),
        password: 'OrgPass123!',
        serviceCategory: 'ambulance',
        generalNumber: 14123456,
      };

      // No existing org with same name+category
      mockDb.query.organization.findFirst.mockResolvedValue(undefined as never);

      const fakeCreated = {
        id: 'new-org-id',
        name: 'New Hospital',
        serviceCategory: 'ambulance',
        generalNumber: '01-4123456',
      };
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([fakeCreated]),
        }),
      });

      await registerOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(201);
    });

    it('should reject registration with existing organization name and category', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };
      mockReq.body = {
        name: testOrganizations.validOrg.name,
        email: generateRandomEmail(),
        password: 'OrgPass123!',
        serviceCategory: testOrganizations.validOrg.serviceCategory,
        generalNumber: '01-4123456',
      };

      mockDb.query.organization.findFirst.mockResolvedValue(
        testOrganizations.validOrg as never
      );

      await registerOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should hash password before storing', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };
      const plainPassword = 'OrgPass123!';
      mockReq.body = {
        name: 'Hash Test Hospital',
        email: generateRandomEmail(),
        password: plainPassword,
        serviceCategory: 'ambulance',
        generalNumber: 14123456,
      };

      mockDb.query.organization.findFirst.mockResolvedValue(undefined as never);

      let capturedValues: any = null;
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockImplementation((data: any) => {
          capturedValues = data;
          return {
            returning: vi.fn().mockResolvedValue([
              {
                id: 'hashed-org-id',
                name: data.name,
                serviceCategory: data.serviceCategory,
                generalNumber: data.generalNumber,
              },
            ]),
          };
        }),
      });

      await registerOrganization(mockReq as any, mockRes as any, mockNext);

      expect(capturedValues).not.toBeNull();
      expect(capturedValues.password).not.toBe(plainPassword);
      const isHashed = await bcrypt.compare(
        plainPassword,
        capturedValues.password
      );
      expect(isHashed).toBe(true);
    });
  });

  describe('loginOrganization', () => {
    it('should reject login with missing credentials', async () => {
      mockReq.body = {
        email: 'hospital@example.com',
      };

      await loginOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject login with invalid email format', async () => {
      mockReq.body = {
        email: 'invalid-email',
        password: 'OrgPass123!',
      };

      await loginOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should return OTP for unverified organization', async () => {
      const hashedPassword = await bcrypt.hash('OrgPass123!', 10);
      mockReq.body = {
        email: testOrganizations.unverifiedOrg.email,
        password: 'OrgPass123!',
      };

      mockDb.query.organization.findFirst.mockResolvedValue({
        ...testOrganizations.unverifiedOrg,
        password: hashedPassword,
        isVerified: false,
        lifecycleStatus: 'pending_approval',
      } as never);

      // loginOrganization update (set verificationToken) - no returning
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await loginOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect((data as any)?.data?.organizationId).toBe(
        testOrganizations.unverifiedOrg.id
      );
    });

    it('should return JWT token for verified organization', async () => {
      const hashedPassword = await bcrypt.hash('OrgPass123!', 10);
      mockReq.body = {
        email: testOrganizations.validOrg.email,
        password: 'OrgPass123!',
      };

      mockDb.query.organization.findFirst.mockResolvedValue({
        ...testOrganizations.validOrg,
        password: hashedPassword,
        isVerified: true,
        lifecycleStatus: 'active',
      } as never);

      await loginOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect((data as any)?.data?.token).toBeTruthy();
    });

    it('should reject login with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('CorrectPass123!', 10);
      mockReq.body = {
        email: testOrganizations.validOrg.email,
        password: 'WrongPass123!',
      };

      mockDb.query.organization.findFirst.mockResolvedValue({
        ...testOrganizations.validOrg,
        password: hashedPassword,
        isVerified: true,
        lifecycleStatus: 'active',
      } as never);

      await loginOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject login for non-existent organization', async () => {
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'OrgPass123!',
      };

      mockDb.query.organization.findFirst.mockResolvedValue(undefined as never);

      await loginOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });
  });

  describe('verifyOrgOTP', () => {
    it('should reject verification without OTP token', async () => {
      mockReq.body = {
        userId: 'test-org-id',
      };

      await verifyOrgOTP(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject verification without user ID', async () => {
      mockReq.body = {
        otpToken: '123456',
      };

      await verifyOrgOTP(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should verify organization with correct OTP', async () => {
      // Controller appends 'Z' to the stored string: new Date(tokenExpiryStr + 'Z')
      // So store it WITHOUT the trailing 'Z'
      const validExpiry = new Date(Date.now() + 10 * 60 * 1000)
        .toISOString()
        .replace('Z', '');
      mockReq.body = {
        otpToken: '123456',
        organizationId: testOrganizations.unverifiedOrg.id,
      };

      mockDb.query.organization.findFirst.mockResolvedValue({
        ...testOrganizations.unverifiedOrg,
        verificationToken: '123456',
        tokenExpiry: validExpiry,
      } as never);

      const updatedOrg = {
        id: testOrganizations.unverifiedOrg.id,
        name: testOrganizations.unverifiedOrg.name,
        generalNumber: testOrganizations.unverifiedOrg.generalNumber,
        isVerified: true,
      };
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedOrg]),
        }),
      });

      await verifyOrgOTP(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);
    });

    it('should reject expired OTP', async () => {
      // Controller appends 'Z' to tokenExpiry string, so store without 'Z'
      const expiredExpiry = new Date(Date.now() - 60 * 1000)
        .toISOString()
        .replace('Z', '');
      mockReq.body = {
        otpToken: '123456',
        organizationId: testOrganizations.unverifiedOrg.id,
      };

      mockDb.query.organization.findFirst.mockResolvedValue({
        ...testOrganizations.unverifiedOrg,
        verificationToken: '123456',
        tokenExpiry: expiredExpiry,
      } as never);

      await verifyOrgOTP(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject invalid OTP', async () => {
      // Controller appends 'Z' to tokenExpiry string, so store without 'Z'
      const validExpiry = new Date(Date.now() + 10 * 60 * 1000)
        .toISOString()
        .replace('Z', '');
      mockReq.body = {
        otpToken: '000000',
        organizationId: testOrganizations.unverifiedOrg.id,
      };

      mockDb.query.organization.findFirst.mockResolvedValue({
        ...testOrganizations.unverifiedOrg,
        verificationToken: '123456',
        tokenExpiry: validExpiry,
      } as never);

      await verifyOrgOTP(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });
  });

  describe('getOrgProfile', () => {
    it('should reject profile request for unauthenticated organization', async () => {
      mockReq.user = null;

      await getOrgProfile(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should return organization profile without sensitive data', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };

      const orgWithoutSensitive = {
        id: testOrganizations.validOrg.id,
        name: testOrganizations.validOrg.name,
        email: testOrganizations.validOrg.email,
        serviceCategory: testOrganizations.validOrg.serviceCategory,
        generalNumber: testOrganizations.validOrg.generalNumber,
        isVerified: testOrganizations.validOrg.isVerified,
      };

      // First findFirst: organization profile
      // Second findFirst: entitlements snapshot (returns null -> use defaults)
      mockDb.query.organization.findFirst.mockResolvedValue(
        orgWithoutSensitive as never
      );
      mockDb.query.organizationEntitlementsSnapshot.findFirst.mockResolvedValue(
        null as never
      );

      await getOrgProfile(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      const user = (data as any)?.data?.user;
      expect(user).toBeDefined();
      expect(user.password).toBeUndefined();
      expect(user.verificationToken).toBeUndefined();
    });
  });

  describe('getAllOrganizations', () => {
    it('should reject request from non-admin user', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };

      await getAllOrganizations(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request from unauthenticated user', async () => {
      mockReq.user = null;

      await getAllOrganizations(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should return all organizations for admin user', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };

      const orgs = [
        testOrganizations.validOrg,
        testOrganizations.unverifiedOrg,
      ];
      mockDb.query.organization.findMany.mockResolvedValue(orgs as never);

      await getAllOrganizations(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect((data as any)?.data).toHaveLength(2);
    });
  });

  describe('getOrganizationById', () => {
    it('should reject request without organization ID', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = {};

      await getOrganizationById(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request from unauthenticated user', async () => {
      mockReq.user = null;
      mockReq.params = { id: 'test-org-id' };

      await getOrganizationById(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should return organization details for valid ID', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: testOrganizations.validOrg.id };

      mockDb.query.organization.findFirst.mockResolvedValue(
        testOrganizations.validOrg as never
      );

      await getOrganizationById(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect((data as any)?.data?.id).toBe(testOrganizations.validOrg.id);
    });

    it('should return 404 for non-existent organization', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: 'non-existent-org-id' };

      mockDb.query.organization.findFirst.mockResolvedValue(undefined as never);

      await getOrganizationById(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.NotFound);
    });
  });

  describe('deleteOrganization', () => {
    it('should reject request from non-admin user', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: 'test-org-id' };

      await deleteOrganization(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request without organization ID', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };
      mockReq.params = {};

      await deleteOrganization(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should delete organization for admin user', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };
      mockReq.params = { id: testOrganizations.validOrg.id };

      mockDb.query.organization.findFirst.mockResolvedValue(
        testOrganizations.validOrg as never
      );

      const deletedOrg = {
        id: testOrganizations.validOrg.id,
        name: testOrganizations.validOrg.name,
        serviceCategory: testOrganizations.validOrg.serviceCategory,
        generalNumber: testOrganizations.validOrg.generalNumber,
      };
      (mockDb.delete as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([deletedOrg]),
        }),
      });

      await deleteOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);
    });

    it('should return 404 for non-existent organization', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };
      mockReq.params = { id: 'non-existent-org-id' };

      mockDb.query.organization.findFirst.mockResolvedValue(undefined as never);

      await deleteOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.NotFound);
    });
  });

  describe('updateOrganization', () => {
    it('should reject request from non-admin user', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: 'test-org-id' };
      mockReq.body = { name: 'Updated Name' };

      await updateOrganization(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject update with empty body', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };
      mockReq.params = { id: 'test-org-id' };
      mockReq.body = {};

      await updateOrganization(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 ||
          [400, 401, 404].includes(getStatusCode(mockRes) as number)
      ).toBe(true);
    });

    it('should update organization with valid data', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };
      mockReq.params = { id: testOrganizations.validOrg.id };
      // Use only keys that exist in the organization schema object
      mockReq.body = { name: 'Updated Hospital Name' };

      mockDb.query.organization.findFirst.mockResolvedValue(
        testOrganizations.validOrg as never
      );

      const updatedOrg = {
        id: testOrganizations.validOrg.id,
        name: 'Updated Hospital Name',
        serviceCategory: testOrganizations.validOrg.serviceCategory,
        generalNumber: testOrganizations.validOrg.generalNumber,
      };
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedOrg]),
          }),
        }),
      });

      await updateOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect((data as any)?.data?.organization?.name).toBe(
        'Updated Hospital Name'
      );
    });

    it('should reject update with invalid fields', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };
      mockReq.params = { id: testOrganizations.validOrg.id };
      mockReq.body = { invalidFieldThatDoesNotExist: 'some-value' };

      mockDb.query.organization.findFirst.mockResolvedValue(
        testOrganizations.validOrg as never
      );

      await updateOrganization(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });
  });

  describe('listOrganizationsPublic', () => {
    it('should return list of verified organizations', async () => {
      const verifiedOrgs = [
        {
          id: testOrganizations.validOrg.id,
          name: testOrganizations.validOrg.name,
          email: testOrganizations.validOrg.email,
          serviceCategory: testOrganizations.validOrg.serviceCategory,
        },
      ];
      mockDb.query.organization.findMany.mockResolvedValue(
        verifiedOrgs as never
      );

      await listOrganizationsPublic(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect(Array.isArray((data as any)?.data)).toBe(true);
    });

    it('should only return id, name, email, and serviceCategory fields', async () => {
      const verifiedOrgs = [
        {
          id: testOrganizations.validOrg.id,
          name: testOrganizations.validOrg.name,
          email: testOrganizations.validOrg.email,
          serviceCategory: testOrganizations.validOrg.serviceCategory,
        },
      ];
      mockDb.query.organization.findMany.mockResolvedValue(
        verifiedOrgs as never
      );

      await listOrganizationsPublic(mockReq as any, mockRes as any, mockNext);

      const data = getResponseData(mockRes);
      const orgs = (data as any)?.data as any[];
      expect(orgs).toHaveLength(1);
      const org = orgs[0];
      expect(org).toHaveProperty('id');
      expect(org).toHaveProperty('name');
      expect(org).toHaveProperty('email');
      expect(org).toHaveProperty('serviceCategory');
      expect(org.password).toBeUndefined();
    });
  });

  describe('getOrgServiceProviders', () => {
    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;

      await getOrgServiceProviders(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should return all service providers for the organization', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };

      const providers = [
        {
          id: testServiceProviders.validProvider.id,
          name: testServiceProviders.validProvider.name,
          email: testServiceProviders.validProvider.email,
          phoneNumber: testServiceProviders.validProvider.phoneNumber,
          serviceType: testServiceProviders.validProvider.serviceType,
          isVerified: testServiceProviders.validProvider.isVerified,
        },
      ];
      mockDb.query.serviceProvider.findMany.mockResolvedValue(
        providers as never
      );

      await getOrgServiceProviders(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect(Array.isArray((data as any)?.data)).toBe(true);
    });
  });

  describe('getOrgServiceProviderById', () => {
    it('should reject request without provider ID', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = {};

      await getOrgServiceProviderById(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;
      mockReq.params = { id: 'test-provider-id' };

      await getOrgServiceProviderById(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should return provider details for valid ID', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { id: testServiceProviders.validProvider.id };

      const provider = {
        id: testServiceProviders.validProvider.id,
        name: testServiceProviders.validProvider.name,
        email: testServiceProviders.validProvider.email,
        phoneNumber: testServiceProviders.validProvider.phoneNumber,
        serviceType: testServiceProviders.validProvider.serviceType,
        isVerified: testServiceProviders.validProvider.isVerified,
        organizationId: testOrganizations.validOrg.id,
      };
      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        provider as never
      );

      await getOrgServiceProviderById(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect((data as any)?.data?.id).toBe(
        testServiceProviders.validProvider.id
      );
    });

    it('should return 404 for provider not belonging to organization', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { id: 'provider-from-another-org' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        undefined as never
      );

      await getOrgServiceProviderById(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.NotFound);
    });
  });

  describe('registerOrgServiceProvider', () => {
    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;
      mockReq.body = {
        name: 'New Driver',
        email: generateRandomEmail(),
        password: 'DriverPass123!',
        phoneNumber: '9841234567',
        serviceType: 'ambulance',
      };

      await registerOrgServiceProvider(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should register provider with valid data', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.body = {
        name: 'New Ambulance Driver',
        email: generateRandomEmail(),
        password: 'DriverPass123!',
        phoneNumber: '9841234599',
        serviceType: 'ambulance',
        age: 28,
        primaryAddress: 'Kathmandu, Nepal',
      };

      // Organization exists with matching serviceCategory
      mockDb.query.organization.findFirst.mockResolvedValue({
        ...testOrganizations.validOrg,
        serviceCategory: 'ambulance',
      } as never);

      // No existing provider with same email/phone
      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        undefined as never
      );

      const newProvider = {
        id: 'new-provider-id',
        name: 'New Ambulance Driver',
        email: mockReq.body.email,
        phoneNumber: '9841234599',
        serviceType: 'ambulance',
      };
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newProvider]),
        }),
      });

      await registerOrgServiceProvider(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(201);
    });

    it('should reject if service type does not match organization category', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.body = {
        name: 'Fire Fighter',
        email: generateRandomEmail(),
        password: 'DriverPass123!',
        phoneNumber: '9841234598',
        serviceType: 'fire_brigade', // doesn't match org's 'ambulance' category
        age: 28,
        primaryAddress: 'Kathmandu, Nepal',
      };

      mockDb.query.organization.findFirst.mockResolvedValue({
        ...testOrganizations.validOrg,
        serviceCategory: 'ambulance',
      } as never);

      await registerOrgServiceProvider(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject if provider email/phone already exists', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.body = {
        name: 'Duplicate Driver',
        email: testServiceProviders.validProvider.email,
        password: 'DriverPass123!',
        phoneNumber: String(testServiceProviders.validProvider.phoneNumber),
        serviceType: 'ambulance',
        age: 28,
        primaryAddress: 'Kathmandu, Nepal',
      };

      mockDb.query.organization.findFirst.mockResolvedValue({
        ...testOrganizations.validOrg,
        serviceCategory: 'ambulance',
      } as never);

      // Existing provider found by email/phone
      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        testServiceProviders.validProvider as never
      );

      await registerOrgServiceProvider(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });
  });

  describe('updateOrgServiceProvider', () => {
    it('should reject request without provider ID', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = {};
      mockReq.body = { name: 'Updated Name' };

      await updateOrgServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;
      mockReq.params = { id: 'test-provider-id' };
      mockReq.body = { name: 'Updated Name' };

      await updateOrgServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should update provider with valid data', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { id: testServiceProviders.validProvider.id };
      mockReq.body = { name: 'Updated Driver Name' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        testServiceProviders.validProvider as never
      );

      const updatedProvider = {
        id: testServiceProviders.validProvider.id,
        name: 'Updated Driver Name',
        email: testServiceProviders.validProvider.email,
        phoneNumber: testServiceProviders.validProvider.phoneNumber,
        serviceType: testServiceProviders.validProvider.serviceType,
      };
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedProvider]),
          }),
        }),
      });

      await updateOrgServiceProvider(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);
    });

    it('should return 404 for non-existent provider', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { id: 'non-existent-provider-id' };
      mockReq.body = { name: 'Updated Name' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        undefined as never
      );

      await updateOrgServiceProvider(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.NotFound);
    });
  });

  describe('deleteOrgServiceProvider', () => {
    it('should reject request without provider ID', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = {};

      await deleteOrgServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;
      mockReq.params = { id: 'test-provider-id' };

      await deleteOrgServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should delete provider successfully', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { id: testServiceProviders.validProvider.id };

      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        testServiceProviders.validProvider as never
      );

      (mockDb.delete as any).mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });

      await deleteOrgServiceProvider(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);
    });

    it('should return 404 for non-existent provider', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { id: 'non-existent-provider-id' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        undefined as never
      );

      await deleteOrgServiceProvider(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.NotFound);
    });
  });

  describe('verifyOrgServiceProvider', () => {
    it('should reject request without provider ID', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = {};

      await verifyOrgServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;
      mockReq.params = { id: 'test-provider-id' };

      await verifyOrgServiceProvider(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should verify provider successfully', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { id: testServiceProviders.validProvider.id };

      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        testServiceProviders.validProvider as never
      );

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await verifyOrgServiceProvider(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);
    });

    it('should return 404 for non-existent provider', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = { id: 'non-existent-provider-id' };

      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        undefined as never
      );

      await verifyOrgServiceProvider(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.NotFound);
    });
  });
});
