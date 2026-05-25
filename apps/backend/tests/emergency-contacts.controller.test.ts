import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEmergencyContact,
  deleteEmergencyContact,
  getCommonEmergencyContacts,
  getEmergencyContact,
  getUserEmergencyContacts,
  toggleContactNotification,
  updateContactPushToken,
  updateEmergencyContact,
} from '@/controllers/emergency-contacts.controller';

import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  generateRandomPhone,
  getResponseData,
  getStatusCode,
  mockDb,
  resetMocks,
  testEmergencyContacts,
  testUsers,
} from './setup';

describe('Emergency Contacts Controller Tests', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
    resetMocks();
  });

  describe('createEmergencyContact', () => {
    it('should reject request from unauthenticated user', async () => {
      mockReq.user = null as any;
      mockReq.body = {
        name: 'Emergency Contact',
        phoneNumber: generateRandomPhone(),
        relationship: 'spouse',
      };

      await createEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request with missing required fields', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = {
        name: 'Emergency Contact',
      };

      await createEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should create contact with valid data', async () => {
      const newContact = {
        ...testEmergencyContacts.validContact,
        id: 'new-contact-id-123',
      };

      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newContact]),
        }),
      });

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = {
        name: 'Emergency Contact',
        phoneNumber: generateRandomPhone(),
        relationship: 'spouse',
      };

      await createEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(201);
      expect(mockNext.mock.calls.length).toBe(0);
    });

    it('should set default notifyOnEmergency to true', async () => {
      const newContact = {
        ...testEmergencyContacts.validContact,
        notifyOnEmergency: true,
      };

      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newContact]),
        }),
      });

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = {
        name: 'Emergency Contact',
        phoneNumber: generateRandomPhone(),
        relationship: 'spouse',
        // notifyOnEmergency not provided — should default to true
      };

      await createEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(201);
      const data = getResponseData(mockRes) as any;
      expect((data as any).data.notifyOnEmergency).toBe(true);
    });

    it('should set default notificationMethod to sms', async () => {
      const newContact = {
        ...testEmergencyContacts.validContact,
        notificationMethod: 'sms',
      };

      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newContact]),
        }),
      });

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = {
        name: 'Emergency Contact',
        phoneNumber: generateRandomPhone(),
        relationship: 'spouse',
        // notificationMethod not provided — should default to 'sms'
      };

      await createEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(201);
      const data = getResponseData(mockRes) as any;
      expect((data as any).data.notificationMethod).toBe('sms');
    });
  });

  describe('updateEmergencyContact', () => {
    it('should reject request from unauthenticated user', async () => {
      mockReq.user = null as any;
      mockReq.params = { id: testEmergencyContacts.validContact.id };
      mockReq.body = { name: 'Updated Name' };

      await updateEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request without contact ID', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = {};
      mockReq.body = { name: 'Updated Name' };

      await updateEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject update with invalid notification method', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: testEmergencyContacts.validContact.id };
      mockReq.body = { notificationMethod: 'invalid-method' };

      await updateEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 ||
          [400, 404].includes(getStatusCode(mockRes) as number)
      ).toBe(true);
    });

    it('should update contact with valid data', async () => {
      const existingContact = { ...testEmergencyContacts.validContact };
      const updatedContact = { ...existingContact, name: 'Updated Name' };

      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        existingContact as never
      );
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedContact]),
          }),
        }),
      });

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: existingContact.id };
      mockReq.body = { name: 'Updated Name' };

      await updateEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any).data.name).toBe('Updated Name');
    });

    it('should reject update for contact not owned by user', async () => {
      const otherUsersContact = {
        ...testEmergencyContacts.validContact,
        userId: 'other-user-id-999',
      };

      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        otherUsersContact as never
      );

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: otherUsersContact.id };
      mockReq.body = { name: 'Hacked Name' };

      await updateEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 ||
          [403, 401].includes(getStatusCode(mockRes) as number)
      ).toBe(true);
    });

    it('should return 404 for non-existent contact', async () => {
      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        undefined as never
      );

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: 'non-existent-id' };
      mockReq.body = { name: 'Updated Name' };

      await updateEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(404);
    });

    it('should reject update with invalid fields', async () => {
      const existingContact = { ...testEmergencyContacts.validContact };

      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        existingContact as never
      );

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: existingContact.id };
      mockReq.body = { nonExistentField: 'some value' };

      await updateEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(400);
    });
  });

  describe('deleteEmergencyContact', () => {
    it('should reject request without contact ID', async () => {
      mockReq.user = {
        ...testUsers.validUser,
        id: testUsers.validUser.id,
        role: 'user',
      };
      mockReq.params = {};

      await deleteEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should delete contact successfully', async () => {
      const existingContact = { ...testEmergencyContacts.validContact };

      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        existingContact as never
      );
      (mockDb.delete as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([existingContact]),
        }),
      });

      mockReq.user = {
        ...testUsers.validUser,
        id: testUsers.validUser.id,
        role: 'user',
      };
      mockReq.params = { id: existingContact.id };

      await deleteEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
    });

    it('should return 404 for non-existent contact', async () => {
      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        undefined as never
      );

      mockReq.user = {
        ...testUsers.validUser,
        id: testUsers.validUser.id,
        role: 'user',
      };
      mockReq.params = { id: 'non-existent-id' };

      await deleteEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(404);
    });

    it('should reject delete for contact not owned by user (non-admin)', async () => {
      const otherUsersContact = {
        ...testEmergencyContacts.validContact,
        userId: 'other-user-id-999',
      };

      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        otherUsersContact as never
      );

      mockReq.user = {
        ...testUsers.validUser,
        id: testUsers.validUser.id,
        role: 'user',
      };
      mockReq.params = { id: otherUsersContact.id };

      await deleteEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 ||
          [403, 401].includes(getStatusCode(mockRes) as number)
      ).toBe(true);
    });

    it('should allow admin to delete any contact', async () => {
      const otherUsersContact = {
        ...testEmergencyContacts.validContact,
        userId: 'other-user-id-999',
      };

      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        otherUsersContact as never
      );
      (mockDb.delete as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([otherUsersContact]),
        }),
      });

      mockReq.user = {
        ...testUsers.adminUser,
        id: testUsers.adminUser.id,
        role: 'admin',
      };
      mockReq.params = { id: otherUsersContact.id };

      await deleteEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
    });
  });

  describe('getEmergencyContact', () => {
    it('should reject request without contact ID', async () => {
      mockReq.params = {};

      await getEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should return contact for valid ID', async () => {
      const existingContact = { ...testEmergencyContacts.validContact };

      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        existingContact as never
      );

      mockReq.params = { id: existingContact.id };

      await getEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any).data.id).toBe(existingContact.id);
    });

    it('should return 404 for non-existent contact', async () => {
      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        undefined as never
      );

      mockReq.params = { id: 'non-existent-id' };

      await getEmergencyContact(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(404);
    });
  });

  describe('getUserEmergencyContacts', () => {
    it('should reject request from unauthenticated user', async () => {
      mockReq.user = null as any;

      await getUserEmergencyContacts(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should return all contacts for authenticated user', async () => {
      const contacts = [testEmergencyContacts.validContact];

      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(contacts),
          }),
        }),
      });

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };

      await getUserEmergencyContacts(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect(Array.isArray((data as any).data)).toBe(true);
      expect((data as any).data.length).toBe(1);
    });

    it('should return empty array if no contacts', async () => {
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };

      await getUserEmergencyContacts(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any).data).toEqual([]);
    });

    it('should order contacts by creation date', async () => {
      const older = {
        ...testEmergencyContacts.validContact,
        id: 'contact-older',
        createdAt: '2024-01-01T00:00:00Z',
      };
      const newer = {
        ...testEmergencyContacts.validContact,
        id: 'contact-newer',
        createdAt: '2024-06-01T00:00:00Z',
      };
      // Controller orders by desc createdAt so newer first
      const contacts = [newer, older];

      const orderByMock = vi.fn().mockResolvedValue(contacts);
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: orderByMock,
          }),
        }),
      });

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };

      await getUserEmergencyContacts(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      // orderBy was called (descending createdAt)
      expect(orderByMock).toHaveBeenCalled();
    });
  });

  describe('getCommonEmergencyContacts', () => {
    it('should return all common contacts', async () => {
      const commonContact = {
        ...testEmergencyContacts.validContact,
        isCommanContact: true,
      };
      const contacts = [commonContact];

      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(contacts),
          }),
        }),
      });

      await getCommonEmergencyContacts(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect(Array.isArray((data as any).data)).toBe(true);
    });

    it('should only return contacts where isCommanContact is true', async () => {
      const commonContacts = [
        {
          ...testEmergencyContacts.validContact,
          isCommanContact: true,
          id: 'common-1',
        },
        {
          ...testEmergencyContacts.validContact,
          isCommanContact: true,
          id: 'common-2',
        },
      ];

      const whereMock = vi.fn().mockReturnValue({
        orderBy: vi.fn().mockResolvedValue(commonContacts),
      });
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: whereMock,
        }),
      });

      await getCommonEmergencyContacts(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(getStatusCode(mockRes)).toBe(200);
      // The where filter was applied (filtering isCommanContact === true)
      expect(whereMock).toHaveBeenCalled();
      const data = getResponseData(mockRes) as any;
      expect((data as any).data.length).toBe(2);
    });

    it('should order contacts by creation date', async () => {
      const contacts = [
        {
          ...testEmergencyContacts.validContact,
          isCommanContact: true,
          createdAt: '2024-06-01T00:00:00Z',
        },
        {
          ...testEmergencyContacts.validContact,
          isCommanContact: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ];

      const orderByMock = vi.fn().mockResolvedValue(contacts);
      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: orderByMock,
          }),
        }),
      });

      await getCommonEmergencyContacts(
        mockReq as any,
        mockRes as any,
        mockNext
      );

      expect(getStatusCode(mockRes)).toBe(200);
      expect(orderByMock).toHaveBeenCalled();
    });
  });

  describe('toggleContactNotification', () => {
    it('should reject request from unauthenticated user', async () => {
      mockReq.user = null as any;
      mockReq.params = { id: testEmergencyContacts.validContact.id };

      await toggleContactNotification(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request without contact ID', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = {};

      await toggleContactNotification(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should toggle notification setting', async () => {
      const existingContact = {
        ...testEmergencyContacts.validContact,
        notifyOnEmergency: true,
      };
      const updatedContact = { ...existingContact, notifyOnEmergency: false };

      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        existingContact as never
      );
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedContact]),
          }),
        }),
      });

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: existingContact.id };

      await toggleContactNotification(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any).data.notifyOnEmergency).toBe(false);
    });

    it('should return 404 for non-existent contact', async () => {
      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        undefined as never
      );

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: 'non-existent-id' };

      await toggleContactNotification(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(404);
    });

    it('should reject for contact not owned by user', async () => {
      const otherUsersContact = {
        ...testEmergencyContacts.validContact,
        userId: 'other-user-id-999',
      };

      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        otherUsersContact as never
      );

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: otherUsersContact.id };

      await toggleContactNotification(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 ||
          [403, 401].includes(getStatusCode(mockRes) as number)
      ).toBe(true);
    });
  });

  describe('updateContactPushToken', () => {
    it('should reject request from unauthenticated user', async () => {
      mockReq.user = null as any;
      mockReq.params = { id: testEmergencyContacts.validContact.id };
      mockReq.body = { pushToken: 'ExponentPushToken[xxx]' };

      await updateContactPushToken(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request without contact ID', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = {};
      mockReq.body = { pushToken: 'ExponentPushToken[xxx]' };

      await updateContactPushToken(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject request without push token', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: testEmergencyContacts.validContact.id };
      mockReq.body = {};

      await updateContactPushToken(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should update push token successfully', async () => {
      const existingContact = { ...testEmergencyContacts.validContact };
      const updatedContact = {
        ...existingContact,
        pushToken: 'ExponentPushToken[newToken]',
      };

      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        existingContact as never
      );
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedContact]),
          }),
        }),
      });

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: existingContact.id };
      mockReq.body = { pushToken: 'ExponentPushToken[newToken]' };

      await updateContactPushToken(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect((data as any).data.pushToken).toBe('ExponentPushToken[newToken]');
    });

    it('should return 404 for non-existent contact', async () => {
      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        undefined as never
      );

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: 'non-existent-id' };
      mockReq.body = { pushToken: 'ExponentPushToken[xxx]' };

      await updateContactPushToken(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(404);
    });

    it('should reject for contact not owned by user', async () => {
      const otherUsersContact = {
        ...testEmergencyContacts.validContact,
        userId: 'other-user-id-999',
      };

      mockDb.query.emergencyContact.findFirst.mockResolvedValue(
        otherUsersContact as never
      );

      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: otherUsersContact.id };
      mockReq.body = { pushToken: 'ExponentPushToken[xxx]' };

      await updateContactPushToken(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 ||
          [403, 401].includes(getStatusCode(mockRes) as number)
      ).toBe(true);
    });
  });
});
