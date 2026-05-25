import { HttpStatusCode } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEmergencyResponse,
  deleteEmergencyResponse,
  getEmergencyResponse,
  getProviderResponses,
  updateEmergencyResponse,
} from '@/controllers/emergency-response.controller';

import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  getResponseData,
  getStatusCode,
  mockDb,
  resetMocks,
  testEmergencyRequests,
  testLocations,
  testServiceProviders,
  testUsers,
} from './setup';

vi.mock('@/utils/maps/galli-maps', () => ({
  getOptimalRoute: vi
    .fn()
    .mockResolvedValue({ distance: 1000, duration: 300, steps: [] }),
  compeletAutoSearch: vi.fn().mockResolvedValue([]),
}));

describe('Emergency Response Controller Tests', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
    resetMocks();
  });

  describe('createEmergencyResponse', () => {
    it('should reject request from unauthenticated user', async () => {
      mockReq.user = null;
      mockReq.body = {
        emergencyRequestId: testEmergencyRequests.pendingRequest.id,
        destLocation: testLocations.kathmandu,
      };

      await createEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject request without emergency request ID', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = {
        destLocation: testLocations.kathmandu,
      };

      await createEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject request with invalid destination coordinates', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = {
        emergencyRequestId: testEmergencyRequests.pendingRequest.id,
        destLocation: { latitude: 'invalid', longitude: 'invalid' },
      };

      await createEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject if response already exists for request', async () => {
      mockDb.query.emergencyResponse.findFirst.mockResolvedValue({
        id: 'existing-response',
        emergencyRequestId: testEmergencyRequests.pendingRequest.id,
      } as never);

      mockReq.user = { ...testUsers.validUser };
      mockReq.body = {
        emergencyRequestId: testEmergencyRequests.pendingRequest.id,
        destLocation: testLocations.kathmandu,
      };

      await createEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.BadRequest);
    });

    it('should create emergency response with valid data', async () => {
      mockDb.query.emergencyResponse.findFirst.mockResolvedValue(
        undefined as never
      );
      mockDb.query.emergencyRequest.findFirst.mockResolvedValue(
        testEmergencyRequests.pendingRequest as never
      );
      const fakeProvider = { ...testServiceProviders.validProvider };
      // update serviceProvider (find available) → returning provider
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([fakeProvider]),
          }),
        }),
      });
      // findFirst for assignedServiceProvider
      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        fakeProvider as never
      );
      // insert emergencyResponse
      const fakeCreatedResponse = {
        id: 'new-resp-1',
        emergencyRequestId: testEmergencyRequests.pendingRequest.id,
      };
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([fakeCreatedResponse]),
        }),
      });

      mockReq.user = { ...testUsers.validUser };
      mockReq.body = {
        emergencyRequestId: testEmergencyRequests.pendingRequest.id,
        destLocation: testLocations.kathmandu,
      };

      await createEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(201);
      const data = getResponseData(mockRes) as any;
      expect(data?.data?.emergencyResponse).toBeDefined();
    });

    it('should use user current location if destLocation not provided', async () => {
      mockDb.query.emergencyResponse.findFirst.mockResolvedValue(
        undefined as never
      );
      mockDb.query.emergencyRequest.findFirst.mockResolvedValue(
        testEmergencyRequests.pendingRequest as never
      );
      const fakeProvider = { ...testServiceProviders.validProvider };
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([fakeProvider]),
          }),
        }),
      });
      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        fakeProvider as never
      );
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-resp-1' }]),
        }),
      });

      // User has currentLocation — no destLocation in body
      mockReq.user = {
        ...testUsers.validUser,
        currentLocation: { latitude: '27.7172', longitude: '85.3240' },
      };
      mockReq.body = {
        emergencyRequestId: testEmergencyRequests.pendingRequest.id,
      };

      await createEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(201);
    });

    it('should compute optimal path to destination', async () => {
      const { getOptimalRoute } = await import('@/utils/maps/galli-maps');
      mockDb.query.emergencyResponse.findFirst.mockResolvedValue(
        undefined as never
      );
      mockDb.query.emergencyRequest.findFirst.mockResolvedValue(
        testEmergencyRequests.pendingRequest as never
      );
      const fakeProvider = { ...testServiceProviders.validProvider };
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([fakeProvider]),
          }),
        }),
      });
      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        fakeProvider as never
      );
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-resp-1' }]),
        }),
      });

      mockReq.user = { ...testUsers.validUser };
      mockReq.body = {
        emergencyRequestId: testEmergencyRequests.pendingRequest.id,
        destLocation: testLocations.kathmandu,
      };

      await createEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getOptimalRoute).toHaveBeenCalled();
    });

    it('should update emergency request status to assigned', async () => {
      mockDb.query.emergencyResponse.findFirst.mockResolvedValue(
        undefined as never
      );
      mockDb.query.emergencyRequest.findFirst.mockResolvedValue(
        testEmergencyRequests.pendingRequest as never
      );
      const fakeProvider = { ...testServiceProviders.validProvider };
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([fakeProvider]),
        }),
      });
      (mockDb.update as any).mockReturnValue({ set: setMock });
      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        fakeProvider as never
      );
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-resp-1' }]),
        }),
      });

      mockReq.user = { ...testUsers.validUser };
      mockReq.body = {
        emergencyRequestId: testEmergencyRequests.pendingRequest.id,
        destLocation: testLocations.kathmandu,
      };

      await createEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({ requestStatus: 'assigned' })
      );
    });

    it('should update service provider status to assigned', async () => {
      mockDb.query.emergencyResponse.findFirst.mockResolvedValue(
        undefined as never
      );
      mockDb.query.emergencyRequest.findFirst.mockResolvedValue(
        testEmergencyRequests.pendingRequest as never
      );
      const fakeProvider = { ...testServiceProviders.validProvider };
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([fakeProvider]),
        }),
      });
      (mockDb.update as any).mockReturnValue({ set: setMock });
      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        fakeProvider as never
      );
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'new-resp-1' }]),
        }),
      });

      mockReq.user = { ...testUsers.validUser };
      mockReq.body = {
        emergencyRequestId: testEmergencyRequests.pendingRequest.id,
        destLocation: testLocations.kathmandu,
      };

      await createEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({ serviceStatus: 'assigned' })
      );
    });
  });

  describe('getEmergencyResponse', () => {
    it('should reject request without ID', async () => {
      mockReq.params = {};

      await getEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should return emergency response for valid ID', async () => {
      const fakeResponse = {
        id: 'resp-1',
        emergencyRequestId: testEmergencyRequests.pendingRequest.id,
      };
      mockDb.query.emergencyResponse.findFirst.mockResolvedValue(
        fakeResponse as never
      );
      mockReq.params = { id: 'resp-1' };

      await getEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.Ok);
    });

    it('should return 404 for non-existent response', async () => {
      mockDb.query.emergencyResponse.findFirst.mockResolvedValue(
        undefined as never
      );
      mockReq.params = { id: 'non-existent' };

      await getEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.NotFound);
    });
  });

  describe('updateEmergencyResponse', () => {
    it('should reject request without ID', async () => {
      mockReq.params = {};
      mockReq.body = { statusUpdate: 'on_route' };

      await updateEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should return 404 for non-existent response', async () => {
      mockDb.query.emergencyResponse.findFirst.mockResolvedValue(
        undefined as never
      );
      mockReq.params = { id: 'non-existent' };
      mockReq.body = { statusUpdate: 'arrived' };

      await updateEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.NotFound);
    });

    it('should update response with valid status', async () => {
      const fakeResponse = {
        id: 'resp-1',
        emergencyRequestId: testEmergencyRequests.assignedRequest.id,
        serviceProviderId: testServiceProviders.validProvider.id,
      };
      mockDb.query.emergencyResponse.findFirst.mockResolvedValueOnce(
        fakeResponse as never
      );
      mockDb.query.emergencyRequest.findFirst.mockResolvedValue(
        testEmergencyRequests.assignedRequest as never
      );
      (mockDb.transaction as any).mockImplementation(async (cb: any) => {
        const updatedResponse = { ...fakeResponse, statusUpdate: 'arrived' };
        const returning = vi.fn().mockResolvedValue([updatedResponse]);
        const where = vi.fn().mockReturnValue({ returning });
        (mockDb.update as any).mockReturnValue({
          set: vi.fn().mockReturnValue({ where }),
        });
        return cb(mockDb);
      });

      mockReq.params = { id: 'resp-1' };
      mockReq.body = { statusUpdate: 'arrived' };

      await updateEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.Ok);
    });

    it('should set request status to in_progress when provider arrives', async () => {
      const fakeResponse = {
        id: 'resp-1',
        emergencyRequestId: testEmergencyRequests.assignedRequest.id,
      };
      mockDb.query.emergencyResponse.findFirst.mockResolvedValueOnce(
        fakeResponse as never
      );
      mockDb.query.emergencyRequest.findFirst.mockResolvedValue(
        testEmergencyRequests.assignedRequest as never
      );

      let capturedRequestStatus: string | undefined;
      (mockDb.transaction as any).mockImplementation(async (cb: any) => {
        const returning = vi.fn().mockImplementation((fields: any) => {
          return Promise.resolve([fakeResponse]);
        });
        const where = vi.fn().mockReturnValue({ returning });
        const set = vi.fn().mockImplementation((data: any) => {
          if (data.requestStatus) capturedRequestStatus = data.requestStatus;
          return { where };
        });
        (mockDb.update as any).mockReturnValue({ set });
        return cb(mockDb);
      });

      mockReq.params = { id: 'resp-1' };
      mockReq.body = { statusUpdate: 'arrived' };

      await updateEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(capturedRequestStatus).toBe('in_progress');
    });

    it('should set request status to pending when provider rejects', async () => {
      const fakeResponse = { id: 'resp-1', emergencyRequestId: 'req-1' };
      mockDb.query.emergencyResponse.findFirst.mockResolvedValueOnce(
        fakeResponse as never
      );
      mockDb.query.emergencyRequest.findFirst.mockResolvedValue({
        id: 'req-1',
        userId: 'u-1',
      } as never);

      let capturedRequestStatus: string | undefined;
      (mockDb.transaction as any).mockImplementation(async (cb: any) => {
        const returning = vi.fn().mockResolvedValue([fakeResponse]);
        const where = vi.fn().mockReturnValue({ returning });
        const set = vi.fn().mockImplementation((data: any) => {
          if (data.requestStatus) capturedRequestStatus = data.requestStatus;
          return { where };
        });
        (mockDb.update as any).mockReturnValue({ set });
        return cb(mockDb);
      });

      mockReq.params = { id: 'resp-1' };
      mockReq.body = { statusUpdate: 'rejected' };

      await updateEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(capturedRequestStatus).toBe('pending');
    });

    it('should set request to completed when provider completes', async () => {
      const fakeResponse = {
        id: 'resp-1',
        emergencyRequestId: testEmergencyRequests.assignedRequest.id,
      };
      mockDb.query.emergencyResponse.findFirst.mockResolvedValueOnce(
        fakeResponse as never
      );
      mockDb.query.emergencyRequest.findFirst.mockResolvedValue(
        testEmergencyRequests.assignedRequest as never
      );

      let capturedRequestStatus: string | undefined;
      (mockDb.transaction as any).mockImplementation(async (cb: any) => {
        const returning = vi
          .fn()
          .mockResolvedValue([{ ...fakeResponse, statusUpdate: 'completed' }]);
        const where = vi.fn().mockReturnValue({ returning });
        const set = vi.fn().mockImplementation((data: any) => {
          if (data.requestStatus) capturedRequestStatus = data.requestStatus;
          return { where };
        });
        (mockDb.update as any).mockReturnValue({ set });
        return cb(mockDb);
      });

      mockReq.params = { id: 'resp-1' };
      mockReq.body = { statusUpdate: 'completed' };

      await updateEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(capturedRequestStatus).toBe('completed');
    });
  });

  describe('deleteEmergencyResponse', () => {
    it('should reject request without ID', async () => {
      mockReq.params = {};

      await deleteEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should delete response successfully', async () => {
      const fakeResponse = { id: 'resp-1', emergencyRequestId: 'req-1' };
      mockDb.query.emergencyResponse.findFirst.mockResolvedValue(
        fakeResponse as never
      );
      (mockDb.delete as any).mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([fakeResponse]),
        }),
      });
      mockReq.params = { id: 'resp-1' };

      await deleteEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.Ok);
    });

    it('should return 404 for non-existent response', async () => {
      mockDb.query.emergencyResponse.findFirst.mockResolvedValue(
        undefined as never
      );
      mockReq.params = { id: 'non-existent' };

      await deleteEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.NotFound);
    });
  });

  describe('getProviderResponses', () => {
    it('should reject request from unauthenticated provider', async () => {
      mockReq.user = null;

      await getProviderResponses(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should return all responses for authenticated provider', async () => {
      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        testServiceProviders.validProvider as never
      );
      mockDb.query.emergencyResponse.findMany.mockResolvedValue([
        {
          id: 'resp-1',
          serviceProviderId: testServiceProviders.validProvider.id,
        },
      ] as never);
      mockReq.user = { ...testServiceProviders.validProvider };

      await getProviderResponses(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.Ok);
      const data = getResponseData(mockRes) as any;
      expect(Array.isArray(data?.data)).toBe(true);
    });

    it('should return empty array if no responses', async () => {
      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        testServiceProviders.validProvider as never
      );
      mockDb.query.emergencyResponse.findMany.mockResolvedValue([] as never);
      mockReq.user = { ...testServiceProviders.validProvider };

      await getProviderResponses(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.Ok);
      const data = getResponseData(mockRes) as any;
      expect(data?.data).toEqual([]);
    });

    it('should reject if user is not a service provider', async () => {
      mockDb.query.serviceProvider.findFirst.mockResolvedValue(
        undefined as never
      );
      mockReq.user = { ...testUsers.validUser };

      await getProviderResponses(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.Unauthorized);
    });
  });

  describe('Status Update Scenarios', () => {
    const makeTransactionMock = (statusUpdate: string) => {
      const fakeResponse = { id: 'resp-1', emergencyRequestId: 'req-1' };
      let capturedStatus: string | undefined;
      (mockDb.transaction as any).mockImplementation(async (cb: any) => {
        const returning = vi
          .fn()
          .mockResolvedValue([{ ...fakeResponse, statusUpdate }]);
        const where = vi.fn().mockReturnValue({ returning });
        const set = vi.fn().mockImplementation((data: any) => {
          if (data.requestStatus) capturedStatus = data.requestStatus;
          return { where };
        });
        (mockDb.update as any).mockReturnValue({ set });
        return cb(mockDb);
      });
      return { fakeResponse, getCapturedStatus: () => capturedStatus };
    };

    it('should set request status to assigned for on_route update', async () => {
      const { fakeResponse, getCapturedStatus } =
        makeTransactionMock('on_route');
      mockDb.query.emergencyResponse.findFirst.mockResolvedValueOnce(
        fakeResponse as never
      );
      mockDb.query.emergencyRequest.findFirst.mockResolvedValue({
        id: 'req-1',
        userId: 'u-1',
      } as never);

      mockReq.params = { id: 'resp-1' };
      mockReq.body = { statusUpdate: 'on_route' };

      await updateEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.Ok);
      // 'on_route' falls through to default → 'assigned'
      expect(getCapturedStatus()).toBe('assigned');
    });

    it('should set request status to in_progress for arrived update', async () => {
      const { fakeResponse, getCapturedStatus } =
        makeTransactionMock('arrived');
      mockDb.query.emergencyResponse.findFirst.mockResolvedValueOnce(
        fakeResponse as never
      );
      mockDb.query.emergencyRequest.findFirst.mockResolvedValue({
        id: 'req-1',
        userId: 'u-1',
      } as never);

      mockReq.params = { id: 'resp-1' };
      mockReq.body = { statusUpdate: 'arrived' };

      await updateEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getCapturedStatus()).toBe('in_progress');
    });

    it('should set request status back to pending for rejected update', async () => {
      const { fakeResponse, getCapturedStatus } =
        makeTransactionMock('rejected');
      mockDb.query.emergencyResponse.findFirst.mockResolvedValueOnce(
        fakeResponse as never
      );
      mockDb.query.emergencyRequest.findFirst.mockResolvedValue({
        id: 'req-1',
        userId: 'u-1',
      } as never);

      mockReq.params = { id: 'resp-1' };
      mockReq.body = { statusUpdate: 'rejected' };

      await updateEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getCapturedStatus()).toBe('pending');
    });

    it('should set request status to completed for completed update', async () => {
      const { fakeResponse, getCapturedStatus } =
        makeTransactionMock('completed');
      mockDb.query.emergencyResponse.findFirst.mockResolvedValueOnce(
        fakeResponse as never
      );
      mockDb.query.emergencyRequest.findFirst.mockResolvedValue({
        id: 'req-1',
        userId: 'u-1',
      } as never);

      mockReq.params = { id: 'resp-1' };
      mockReq.body = { statusUpdate: 'completed' };

      await updateEmergencyResponse(mockReq as any, mockRes as any, mockNext);

      expect(getCapturedStatus()).toBe('completed');
    });
  });
});
