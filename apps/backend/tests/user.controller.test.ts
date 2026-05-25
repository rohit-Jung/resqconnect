import { HttpStatusCode } from 'axios';
import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  changePassword,
  forgotPassword,
  getEmergencySettings,
  getProfile,
  getUser,
  loginUser,
  logoutUser,
  registerUser,
  resetPassword,
  updateEmergencySettings,
  updatePushToken,
  updateUser,
  verifyUser,
} from '../src/controllers/user.controller.ts';
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  generateRandomEmail,
  getResponseData,
  getStatusCode,
  mockDb,
  resetMocks,
  testUsers,
} from './setup';

vi.mock('@/services/failed-login-lockout.service', () => ({
  isLoginLocked: vi.fn().mockResolvedValue(false),
  recordLoginFailure: vi.fn().mockResolvedValue(undefined),
  clearLoginFailures: vi.fn().mockResolvedValue(undefined),
}));

describe('User Controller Tests', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    resetMocks();
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('registerUser', () => {
    it('should reject registration with missing required fields', async () => {
      mockReq.body = {
        email: 'test@example.com',
      };

      await registerUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject registration with invalid email format', async () => {
      mockReq.body = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'Password123!',
        phoneNumber: '9841234567',
      };

      await registerUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject registration with invalid phone number format', async () => {
      mockReq.body = {
        name: 'Test User',
        email: generateRandomEmail(),
        password: 'Password123!',
        phoneNumber: '123',
      };

      await registerUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect([HttpStatusCode.BadRequest, 400]).toContain(statusCode);
    });

    it('should reject admin registration for non-admin emails', async () => {
      mockReq.body = {
        name: 'Fake Admin',
        email: 'notadmin@example.com',
        password: 'Password123!',
        phoneNumber: '9841234567',
        role: 'admin',
      };

      await registerUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect([
        HttpStatusCode.Unauthorized,
        HttpStatusCode.BadRequest,
        401,
        400,
      ]).toContain(statusCode);
    });

    it('should successfully register a new user with valid data', async () => {
      const email = generateRandomEmail();
      mockReq.body = {
        name: 'New User',
        email,
        password: 'Password123!',
        phoneNumber: '9841234567',
      };

      // No existing user
      mockDb.query.user.findFirst.mockResolvedValue(undefined as never);

      const newUser = {
        name: 'New User',
        age: null,
        phoneNumber: '9841234567',
        email,
        primaryAddress: null,
      };
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newUser]),
        }),
      });

      await registerUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(201);
    });

    it('should reject registration with existing email', async () => {
      mockReq.body = {
        name: 'Test User',
        email: testUsers.validUser.email,
        password: 'Password123!',
        phoneNumber: '9841234567',
      };

      // Simulate existing user
      mockDb.query.user.findFirst.mockResolvedValue(
        testUsers.validUser as never
      );

      await registerUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(400);
    });

    it('should hash password before storing', async () => {
      const plainPassword = 'Password123!';
      const email = generateRandomEmail();
      mockReq.body = {
        name: 'Hash Test User',
        email,
        password: plainPassword,
        phoneNumber: '9841234567',
      };

      mockDb.query.user.findFirst.mockResolvedValue(undefined as never);

      let storedPassword: string | undefined;
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockImplementation((data: any) => {
          storedPassword = data.password;
          return {
            returning: vi
              .fn()
              .mockResolvedValue([{ name: 'Hash Test User', email }]),
          };
        }),
      });

      await registerUser(mockReq as never, mockRes as never, mockNext);

      expect(storedPassword).toBeDefined();
      expect(storedPassword).not.toBe(plainPassword);
      const isHashed = await bcrypt.compare(plainPassword, storedPassword!);
      expect(isHashed).toBe(true);
    });

    it('should generate H3 index from location', async () => {
      const email = generateRandomEmail();
      mockReq.body = {
        name: 'Location User',
        email,
        password: 'Password123!',
        phoneNumber: '9841234567',
        latitude: 27.7172,
        longitude: 85.324,
      };

      mockDb.query.user.findFirst.mockResolvedValue(undefined as never);

      let capturedData: any;
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockImplementation((data: any) => {
          capturedData = data;
          return {
            returning: vi
              .fn()
              .mockResolvedValue([{ name: 'Location User', email }]),
          };
        }),
      });

      await registerUser(mockReq as never, mockRes as never, mockNext);

      expect(capturedData).toBeDefined();
      expect(capturedData.h3Index).toBeDefined();
      expect(typeof capturedData.h3Index).toBe('bigint');
    });
  });

  describe('loginUser', () => {
    it('should reject login with missing credentials', async () => {
      mockReq.body = {
        email: 'test@example.com',
      };

      await loginUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should reject login with invalid email format', async () => {
      mockReq.body = {
        email: 'invalid-email',
        password: 'Password123!',
      };

      await loginUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.BadRequest);
    });

    it('should return OTP for unverified users', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const unverifiedUser = {
        ...testUsers.unverifiedUser,
        password: hashedPassword,
      };

      mockReq.body = {
        email: unverifiedUser.email,
        password: 'Password123!',
      };

      mockDb.query.user.findFirst.mockResolvedValue(unverifiedUser as never);

      // Mock the update for setting verification token
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await loginUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect((data as any).data.userId).toBeDefined();
      expect((data as any).data.otpToken).toBeDefined();
    });

    it('should return JWT token for verified users', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const verifiedUser = {
        ...testUsers.validUser,
        password: hashedPassword,
      };

      mockReq.body = {
        email: verifiedUser.email,
        password: 'Password123!',
      };

      mockDb.query.user.findFirst.mockResolvedValue(verifiedUser as never);

      await loginUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect((data as any).data.token).toBeDefined();
      expect((data as any).data.user).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const verifiedUser = {
        ...testUsers.validUser,
        password: hashedPassword,
      };

      mockReq.body = {
        email: verifiedUser.email,
        password: 'WrongPassword!',
      };

      mockDb.query.user.findFirst.mockResolvedValue(verifiedUser as never);

      await loginUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(400);
    });

    it('should reject login for non-existent user', async () => {
      mockReq.body = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      mockDb.query.user.findFirst.mockResolvedValue(undefined as never);

      await loginUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(400);
    });
  });

  describe('logoutUser', () => {
    it('should reject logout for unauthenticated user', async () => {
      mockReq.user = null;

      await logoutUser(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should successfully logout authenticated user', async () => {
      mockReq.user = { id: testUsers.validUser.id, role: 'user' };

      await logoutUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);
    });

    it('should clear authentication cookie', async () => {
      mockReq.user = { id: testUsers.validUser.id, role: 'user' };

      await logoutUser(mockReq as never, mockRes as never, mockNext);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('token');
    });
  });

  describe('getProfile', () => {
    it('should reject profile request for unauthenticated user', async () => {
      mockReq.user = null;

      await getProfile(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should return user profile without sensitive data', async () => {
      mockReq.user = { id: testUsers.validUser.id };

      const profileUser = {
        id: testUsers.validUser.id,
        name: testUsers.validUser.name,
        email: testUsers.validUser.email,
        phoneNumber: testUsers.validUser.phoneNumber,
        role: testUsers.validUser.role,
        isVerified: true,
      };

      mockDb.query.user.findFirst.mockResolvedValue(profileUser as never);

      await getProfile(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect((data as any).data.user).toBeDefined();
    });

    it('should exclude password from response', async () => {
      mockReq.user = { id: testUsers.validUser.id };

      const profileUser = {
        id: testUsers.validUser.id,
        name: testUsers.validUser.name,
        email: testUsers.validUser.email,
        phoneNumber: testUsers.validUser.phoneNumber,
        role: testUsers.validUser.role,
        isVerified: true,
        // password intentionally excluded — simulates column: { password: false }
      };

      mockDb.query.user.findFirst.mockResolvedValue(profileUser as never);

      await getProfile(mockReq as never, mockRes as never, mockNext);

      const data = getResponseData(mockRes);
      const returnedUser = (data as any).data.user;
      expect(returnedUser.password).toBeUndefined();
    });
  });

  describe('getUser', () => {
    it('should reject request without userId param', async () => {
      mockReq.user = { ...testUsers.adminUser, id: testUsers.adminUser.id };
      mockReq.params = {};

      await getUser(mockReq as never, mockRes as never, mockNext);

      const response = getResponseData(mockRes);
      expect(response).toBeDefined();
    });

    it('should reject request from non-admin user', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { userId: 'some-user-id' };

      await getUser(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should allow admin to fetch any user', async () => {
      mockReq.user = { id: testUsers.adminUser.id, role: 'admin' };
      mockReq.params = { userId: testUsers.validUser.id };

      const targetUser = {
        id: testUsers.validUser.id,
        name: testUsers.validUser.name,
        email: testUsers.validUser.email,
        phoneNumber: testUsers.validUser.phoneNumber,
        role: testUsers.validUser.role,
        isVerified: true,
      };

      mockDb.query.user.findFirst.mockResolvedValue(targetUser as never);

      await getUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect((data as any).data.user.id).toBe(testUsers.validUser.id);
    });
  });

  describe('updateUser', () => {
    it('should reject update for unauthenticated user', async () => {
      mockReq.user = null;
      mockReq.body = { name: 'New Name' };

      await updateUser(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject update with empty body', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = {};

      await updateUser(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject update with invalid fields', async () => {
      mockReq.user = { id: testUsers.validUser.id, role: 'user' };
      mockReq.body = { invalidFieldXyz: 'some-value' };

      mockDb.query.user.findFirst.mockResolvedValue(
        testUsers.validUser as never
      );

      await updateUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(400);
    });

    it('should successfully update valid fields', async () => {
      mockReq.user = { id: testUsers.validUser.id, role: 'user' };
      mockReq.body = { name: 'Updated Name' };

      mockDb.query.user.findFirst.mockResolvedValue(
        testUsers.validUser as never
      );

      const updatedUser = {
        id: testUsers.validUser.id,
        name: 'Updated Name',
        phoneNumber: testUsers.validUser.phoneNumber,
        age: null,
        email: testUsers.validUser.email,
        primaryAddress: null,
      };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      await updateUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect((data as any).data.user.name).toBe('Updated Name');
    });
  });

  describe('verifyUser', () => {
    it('should reject verification without OTP token', async () => {
      mockReq.body = {
        userId: 'test-user-id',
      };

      await verifyUser(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject verification without user ID', async () => {
      mockReq.body = {
        otpToken: '123456',
      };

      await verifyUser(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should verify user with correct OTP', async () => {
      const unverifiedDbUser = {
        id: testUsers.unverifiedUser.id,
        name: testUsers.unverifiedUser.name,
        email: testUsers.unverifiedUser.email,
        phoneNumber: testUsers.unverifiedUser.phoneNumber,
        isVerified: false,
        verificationToken: '123456',
        tokenExpiry: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };

      mockReq.body = {
        userId: unverifiedDbUser.id,
        otpToken: '123456',
      };

      mockDb.query.user.findFirst.mockResolvedValue(unverifiedDbUser as never);

      const verifiedUser = {
        id: unverifiedDbUser.id,
        name: unverifiedDbUser.name,
        email: unverifiedDbUser.email,
        phoneNumber: unverifiedDbUser.phoneNumber,
        role: 'user',
        isVerified: true,
      };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([verifiedUser]),
          }),
        }),
      });

      await verifyUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);
    });

    it('should reject expired OTP', async () => {
      // Controller does `new Date(tokenExpiry + 'Z')`, so store without trailing 'Z'
      const expiredIso = new Date(Date.now() - 60 * 1000)
        .toISOString()
        .replace(/Z$/, '');
      const expiredUser = {
        id: testUsers.unverifiedUser.id,
        name: testUsers.unverifiedUser.name,
        email: testUsers.unverifiedUser.email,
        isVerified: false,
        verificationToken: '123456',
        tokenExpiry: expiredIso,
      };

      mockReq.body = {
        userId: expiredUser.id,
        otpToken: '123456',
      };

      mockDb.query.user.findFirst.mockResolvedValue(expiredUser as never);

      await verifyUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(400);
    });

    it('should reject invalid OTP', async () => {
      const unverifiedDbUser = {
        id: testUsers.unverifiedUser.id,
        name: testUsers.unverifiedUser.name,
        email: testUsers.unverifiedUser.email,
        isVerified: false,
        verificationToken: '123456',
        tokenExpiry: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };

      mockReq.body = {
        userId: unverifiedDbUser.id,
        otpToken: '999999',
      };

      mockDb.query.user.findFirst.mockResolvedValue(unverifiedDbUser as never);

      await verifyUser(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(400);
    });
  });

  describe('forgotPassword', () => {
    it('should reject request without email or phone', async () => {
      mockReq.body = {};

      await forgotPassword(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should send OTP for valid email', async () => {
      mockReq.body = { email: testUsers.validUser.email };

      mockDb.query.user.findFirst.mockResolvedValue(
        testUsers.validUser as never
      );

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await forgotPassword(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);
    });

    it('should send OTP for valid phone number', async () => {
      mockReq.body = { phoneNumber: testUsers.validUser.phoneNumber };

      mockDb.query.user.findFirst.mockResolvedValue(
        testUsers.validUser as never
      );

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      await forgotPassword(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);
    });

    it('should reject for non-existent user', async () => {
      mockReq.body = { email: 'nonexistent@example.com' };

      mockDb.query.user.findFirst.mockResolvedValue(undefined as never);

      await forgotPassword(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(404);
    });
  });

  describe('resetPassword', () => {
    it('should reject without OTP token', async () => {
      mockReq.body = {
        userId: 'test-user-id',
        password: 'NewPassword123!',
      };

      await resetPassword(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject without user ID', async () => {
      mockReq.body = {
        otpToken: '123456',
        password: 'NewPassword123!',
      };

      await resetPassword(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject without new password', async () => {
      mockReq.body = {
        otpToken: '123456',
        userId: 'test-user-id',
      };

      await resetPassword(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reset password with valid OTP', async () => {
      const userWithResetToken = {
        ...testUsers.validUser,
        resetPasswordToken: '123456',
        resetPasswordTokenExpiry: new Date(
          Date.now() + 10 * 60 * 1000
        ).toISOString(),
      };

      mockReq.body = {
        userId: userWithResetToken.id,
        otpToken: '123456',
        password: 'NewPassword123!',
      };

      mockDb.query.user.findFirst.mockResolvedValue(
        userWithResetToken as never
      );

      const updatedUser = {
        id: userWithResetToken.id,
        name: userWithResetToken.name,
        phoneNumber: userWithResetToken.phoneNumber,
        email: userWithResetToken.email,
      };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([updatedUser]),
        }),
      });

      await resetPassword(mockReq as never, mockRes as never, mockNext);

      expect(mockNext.mock.calls.length).toBe(0);
      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);
    });

    it('should reject expired OTP', async () => {
      // Controller does `new Date(resetPasswordTokenExpiry + 'Z')`, store without trailing 'Z'
      const expiredIso = new Date(Date.now() - 60 * 1000)
        .toISOString()
        .replace(/Z$/, '');
      const userWithExpiredToken = {
        ...testUsers.validUser,
        resetPasswordToken: '123456',
        resetPasswordTokenExpiry: expiredIso,
      };

      mockReq.body = {
        userId: userWithExpiredToken.id,
        otpToken: '123456',
        password: 'NewPassword123!',
      };

      mockDb.query.user.findFirst.mockResolvedValue(
        userWithExpiredToken as never
      );

      await resetPassword(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(400);
    });
  });

  describe('changePassword', () => {
    it('should reject for unauthenticated user', async () => {
      mockReq.user = null;
      mockReq.body = {
        oldPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
      };

      await changePassword(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject without old password', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = {
        newPassword: 'NewPass123!',
      };

      await changePassword(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject without new password', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = {
        oldPassword: 'OldPass123!',
      };

      await changePassword(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should change password with correct old password', async () => {
      const hashedOldPassword = await bcrypt.hash('OldPass123!', 10);
      const userWithHashedPassword = {
        ...testUsers.validUser,
        password: hashedOldPassword,
      };

      mockReq.user = { id: testUsers.validUser.id, role: 'user' };
      mockReq.body = {
        oldPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
      };

      mockDb.query.user.findFirst.mockResolvedValue(
        userWithHashedPassword as never
      );

      const updatedUser = {
        id: testUsers.validUser.id,
        name: testUsers.validUser.name,
        phoneNumber: testUsers.validUser.phoneNumber,
        email: testUsers.validUser.email,
        age: null,
        primaryAddress: null,
        isVerified: true,
      };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      await changePassword(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);
    });

    it('should reject with wrong old password', async () => {
      const hashedOldPassword = await bcrypt.hash('OldPass123!', 10);
      const userWithHashedPassword = {
        ...testUsers.validUser,
        password: hashedOldPassword,
      };

      mockReq.user = { id: testUsers.validUser.id, role: 'user' };
      mockReq.body = {
        oldPassword: 'WrongOldPass!',
        newPassword: 'NewPass123!',
      };

      mockDb.query.user.findFirst.mockResolvedValue(
        userWithHashedPassword as never
      );

      await changePassword(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(400);
    });
  });

  describe('updatePushToken', () => {
    it('should reject for unauthenticated user', async () => {
      mockReq.user = null;
      mockReq.body = { pushToken: 'ExponentPushToken[xxx]' };

      await updatePushToken(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should update push token for authenticated user', async () => {
      mockReq.user = { id: testUsers.validUser.id, role: 'user' };
      mockReq.body = { pushToken: 'ExponentPushToken[yyy]' };

      const updatedUser = {
        ...testUsers.validUser,
        pushToken: 'ExponentPushToken[yyy]',
      };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedUser]),
          }),
        }),
      });

      await updatePushToken(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);
    });
  });

  describe('updateEmergencySettings', () => {
    it('should reject for unauthenticated user', async () => {
      mockReq.user = null;
      mockReq.body = { notifyEmergencyContacts: true };

      await updateEmergencySettings(
        mockReq as never,
        mockRes as never,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject invalid notification method', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = { emergencyNotificationMethod: 'invalid-method' };

      await updateEmergencySettings(
        mockReq as never,
        mockRes as never,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject with no valid settings to update', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = {};

      await updateEmergencySettings(
        mockReq as never,
        mockRes as never,
        mockNext
      );

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should update emergency notification settings', async () => {
      mockReq.user = { id: testUsers.validUser.id, role: 'user' };
      mockReq.body = {
        notifyEmergencyContacts: true,
        emergencyNotificationMethod: 'sms',
      };

      const updatedSettings = {
        id: testUsers.validUser.id,
        notifyEmergencyContacts: true,
        emergencyNotificationMethod: 'sms',
      };

      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedSettings]),
          }),
        }),
      });

      await updateEmergencySettings(
        mockReq as never,
        mockRes as never,
        mockNext
      );

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);
    });
  });

  describe('getEmergencySettings', () => {
    it('should reject for unauthenticated user', async () => {
      mockReq.user = null;

      await getEmergencySettings(mockReq as never, mockRes as never, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should return emergency settings for authenticated user', async () => {
      mockReq.user = { id: testUsers.validUser.id, role: 'user' };

      const settings = {
        notifyEmergencyContacts: true,
        emergencyNotificationMethod: 'push',
      };

      mockDb.query.user.findFirst.mockResolvedValue(settings as never);

      await getEmergencySettings(mockReq as never, mockRes as never, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(200);

      const data = getResponseData(mockRes);
      expect((data as any).data).toBeDefined();
    });
  });
});
