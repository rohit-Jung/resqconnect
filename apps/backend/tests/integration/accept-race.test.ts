/**
 * Integration test: distributed lock race on acceptEmergencyRequest.
 *
 * two providers race to accept the same pending request.
 * redis acquirelock ensures exactly one wins; the other gets 409.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import emergencyRequestController from '@/controllers/emergency-request.controller';
import { acquireLock } from '@/services/redis.service';

import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  getStatusCode,
  mockDb,
  resetMocks,
  testEmergencyRequests,
  testServiceProviders,
} from '../setup';

const { accept: acceptEmergencyRequest } = emergencyRequestController;

const pendingRequest = {
  ...testEmergencyRequests.pendingRequest,
  userId: 'user-001',
};

// Insert/update chain helpers.
const makeInsertMock = () => ({
  values: vi.fn().mockResolvedValue([]),
});

const makeUpdateMock = () => ({
  set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
});

describe('acceptEmergencyRequest — distributed lock race', () => {
  beforeEach(() => {
    resetMocks();
    mockDb.query.emergencyRequest.findFirst.mockResolvedValue(
      pendingRequest as never
    );
    mockDb.query.serviceProvider.findFirst.mockResolvedValue(
      testServiceProviders.validProvider as never
    );
    (mockDb.insert as any).mockReturnValue(makeInsertMock());
    (mockDb.update as any).mockReturnValue(makeUpdateMock());
  });

  it('first provider acquires lock and succeeds with 200', async () => {
    // Default acquireLock mock returns true.
    const req = createMockRequest({
      user: { ...testServiceProviders.validProvider },
      params: { id: pendingRequest.id },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await acceptEmergencyRequest(req as never, res as never, next);

    expect(getStatusCode(res)).toBe(200);
    expect(acquireLock).toHaveBeenCalledWith(
      pendingRequest.id,
      testServiceProviders.validProvider.id,
      30
    );
  });

  it('second provider fails to acquire lock and gets 409', async () => {
    (acquireLock as any).mockResolvedValueOnce(false);

    const req = createMockRequest({
      user: { ...testServiceProviders.validProvider, id: 'provider-2' },
      params: { id: pendingRequest.id },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await acceptEmergencyRequest(req as never, res as never, next);

    expect(getStatusCode(res)).toBe(409);
  });

  it('concurrent accepts: exactly one succeeds', async () => {
    // First call acquires, second does not.
    (acquireLock as any)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const provider1 = createMockRequest({
      user: { ...testServiceProviders.validProvider, id: 'p-1' },
      params: { id: pendingRequest.id },
    });
    const provider2 = createMockRequest({
      user: { ...testServiceProviders.validProvider, id: 'p-2' },
      params: { id: pendingRequest.id },
    });
    const res1 = createMockResponse();
    const res2 = createMockResponse();

    await Promise.all([
      acceptEmergencyRequest(
        provider1 as never,
        res1 as never,
        createMockNext()
      ),
      acceptEmergencyRequest(
        provider2 as never,
        res2 as never,
        createMockNext()
      ),
    ]);

    const statuses = [getStatusCode(res1), getStatusCode(res2)];
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);
  });

  it('already-assigned request returns 409 after lock acquired', async () => {
    mockDb.query.emergencyRequest.findFirst.mockResolvedValue({
      ...pendingRequest,
      requestStatus: 'assigned',
    } as never);

    const req = createMockRequest({
      user: { ...testServiceProviders.validProvider },
      params: { id: pendingRequest.id },
    });
    const res = createMockResponse();

    await acceptEmergencyRequest(req as never, res as never, createMockNext());

    expect(getStatusCode(res)).toBe(409);
  });
});
