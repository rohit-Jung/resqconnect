import { HttpStatusCode } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';

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

    it.todo('should successfully register organization with valid data');
    it.todo(
      'should reject registration with existing organization name and category'
    );
    it.todo('should hash password before storing');
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

    it.todo('should return OTP for unverified organization');
    it.todo('should return JWT token for verified organization');
    it.todo('should reject login with wrong password');
    it.todo('should reject login for non-existent organization');
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

    it.todo('should verify organization with correct OTP');
    it.todo('should reject expired OTP');
    it.todo('should reject invalid OTP');
  });

  describe('getOrgProfile', () => {
    it('should reject profile request for unauthenticated organization', async () => {
      mockReq.user = null;

      await getOrgProfile(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it.todo('should return organization profile without sensitive data');
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

    it.todo('should return all organizations for admin user');
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

    it.todo('should return organization details for valid ID');
    it.todo('should return 404 for non-existent organization');
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

    it.todo('should delete organization for admin user');
    it.todo('should return 404 for non-existent organization');
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

    it.todo('should update organization with valid data');
    it.todo('should reject update with invalid fields');
  });

  describe('listOrganizationsPublic', () => {
    it.todo('should return list of verified organizations');
    it.todo('should only return id, name, email, and serviceCategory fields');
  });

  describe('getOrgServiceProviders', () => {
    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;

      await getOrgServiceProviders(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it.todo('should return all service providers for the organization');
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

    it.todo('should return provider details for valid ID');
    it.todo('should return 404 for provider not belonging to organization');
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

    it.todo('should register provider with valid data');
    it.todo(
      'should reject if service type does not match organization category'
    );
    it.todo('should reject if provider email/phone already exists');
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

    it.todo('should update provider with valid data');
    it.todo('should return 404 for non-existent provider');
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

    it.todo('should delete provider successfully');
    it.todo('should return 404 for non-existent provider');
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

    it.todo('should verify provider successfully');
    it.todo('should return 404 for non-existent provider');
  });
});
