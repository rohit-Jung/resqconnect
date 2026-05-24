import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { assignResponderConsumer } from '@/services/kafka/kafka.service';
import * as matchingService from '@/services/matching.service';
import { getIo } from '@/socket';
import { startEmergencyRequestService } from '@/workers/request.worker';

import { mockDb, resetMocks } from '../setup';

// captured eachmessage handler — set by the run mock below.
let eachMessageHandler: (ctx: any) => Promise<void>;

// helper to build a mock kafka message.
const makeMsg = (payload: object) => ({
  topic: 'medical_events',
  partition: 0,
  message: { value: Buffer.from(JSON.stringify(payload)), offset: '0' },
});

// minimal valid payload that passes emergencyrequestpayload zod schema.
const validPayload = {
  requestId: 'req-001',
  userId: 'user-001',
  emergencyType: 'ambulance',
  status: 'pending',
  h3Index: '8b2a10d2892bfff',
  emergencyLocation: { latitude: 27.7172, longitude: 85.324 },
  emergencyDescription: 'Chest pain',
  expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
};

// reusable insert mock that supports both:
//   await db.insert(x).values(y)             (direct await)
//   await db.insert(x).values(y).onConflictDoNothing()
const makeInsertMock = () => {
  const onConflictDoNothing = vi.fn().mockResolvedValue([]);
  const values = vi
    .fn()
    .mockImplementation(() =>
      Object.assign(Promise.resolve([]), { onConflictDoNothing })
    );
  return { values, onConflictDoNothing };
};

// reusable update mock that supports:
//   await db.update(x).set(y).where(z)             (no returning)
//   await db.update(x).set(y).where(z).returning(r)
const makeUpdateMock = (claimResult: any[] = []) => {
  const returning = vi.fn().mockResolvedValue(claimResult);
  const where = vi
    .fn()
    .mockImplementation(() =>
      Object.assign(Promise.resolve(claimResult), { returning })
    );
  const set = vi.fn().mockReturnValue({ where });
  return { set, where, returning };
};

describe('request.worker — eachMessage handler', () => {
  beforeEach(async () => {
    resetMocks();

    // capture the eachmessage callback when startemergencyrequestservice() calls run().
    (assignResponderConsumer.run as any).mockImplementationOnce(
      async ({ eachMessage }: any) => {
        eachMessageHandler = eachMessage;
      }
    );

    vi.spyOn(matchingService, 'findNearbyProviders').mockResolvedValue([]);
    vi.spyOn(matchingService, 'calculateDistancesAndSort').mockResolvedValue(
      []
    );

    await startEmergencyRequestService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should upsert silo DB record before claiming', async () => {
    const insert = makeInsertMock();
    (mockDb.insert as any).mockReturnValue(insert);
    (mockDb.update as any).mockReturnValue(makeUpdateMock([])); // claim fails → early exit
    mockDb.query.user.findFirst.mockResolvedValue(null as never);

    await eachMessageHandler(makeMsg(validPayload));

    expect(mockDb.insert).toHaveBeenCalled();
    expect(insert.values).toHaveBeenCalledWith(
      expect.objectContaining({ id: validPayload.requestId })
    );
    expect(insert.onConflictDoNothing).toHaveBeenCalled();
  });

  it('should skip provider search when request is already claimed', async () => {
    (mockDb.insert as any).mockReturnValue(makeInsertMock());
    (mockDb.update as any).mockReturnValue(makeUpdateMock([])); // empty = already claimed
    mockDb.query.user.findFirst.mockResolvedValue(null as never);

    const spy = vi.spyOn(matchingService, 'findNearbyProviders');

    await eachMessageHandler(makeMsg(validPayload));

    expect(spy).not.toHaveBeenCalled();
  });

  it('should claim request by setting status to in_progress', async () => {
    const updateMock = makeUpdateMock([{ id: validPayload.requestId }]);
    (mockDb.insert as any).mockReturnValue(makeInsertMock());
    (mockDb.update as any).mockReturnValue(updateMock);
    mockDb.query.user.findFirst.mockResolvedValue(null as never);

    await eachMessageHandler(makeMsg(validPayload));

    expect(updateMock.set).toHaveBeenCalledWith(
      expect.objectContaining({ requestStatus: 'in_progress' })
    );
  });

  it('should insert no-providers-initial event when no providers found', async () => {
    vi.spyOn(matchingService, 'findNearbyProviders').mockResolvedValue([]);

    const insert = makeInsertMock();
    (mockDb.insert as any).mockReturnValue(insert);
    (mockDb.update as any).mockReturnValue(
      makeUpdateMock([{ id: validPayload.requestId }]) // claim succeeds
    );
    mockDb.query.user.findFirst.mockResolvedValue(null as never);

    await eachMessageHandler(makeMsg(validPayload));

    expect(insert.values).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'no-providers-initial' })
    );
  });

  it('should broadcast NEW_EMERGENCY to each provider via socket', async () => {
    const providers = [
      { id: 'p-1', name: 'Provider 1' },
      { id: 'p-2', name: 'Provider 2' },
    ];
    vi.spyOn(matchingService, 'findNearbyProviders').mockResolvedValue(
      providers as any
    );
    vi.spyOn(matchingService, 'calculateDistancesAndSort').mockResolvedValue(
      providers as any
    );

    const insert = makeInsertMock();
    (mockDb.insert as any).mockReturnValue(insert);
    // First update call: claim (returns row). Second: reset to pending.
    const updateMock = makeUpdateMock([{ id: validPayload.requestId }]);
    (mockDb.update as any).mockReturnValue(updateMock);
    mockDb.query.user.findFirst.mockResolvedValue({
      name: 'Test User',
      phoneNumber: '9841234567',
      email: 'test@example.com',
    } as never);

    await eachMessageHandler(makeMsg(validPayload));

    const io = (getIo as any)();
    // to() should be called once per provider
    expect(io.to).toHaveBeenCalledTimes(providers.length);
    expect(io.emit).toHaveBeenCalledWith(
      'emergency:new',
      expect.objectContaining({ requestId: validPayload.requestId })
    );
  });

  it('should insert providers-found event when providers exist', async () => {
    const providers = [{ id: 'p-1' }];
    vi.spyOn(matchingService, 'findNearbyProviders').mockResolvedValue(
      providers as any
    );
    vi.spyOn(matchingService, 'calculateDistancesAndSort').mockResolvedValue(
      providers as any
    );

    const insert = makeInsertMock();
    (mockDb.insert as any).mockReturnValue(insert);
    (mockDb.update as any).mockReturnValue(
      makeUpdateMock([{ id: validPayload.requestId }])
    );
    mockDb.query.user.findFirst.mockResolvedValue(null as never);

    await eachMessageHandler(makeMsg(validPayload));

    expect(insert.values).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'providers-found' })
    );
  });

  it('should silently skip messages with invalid format', async () => {
    const badPayload = { notAValidField: 'bad' };

    await eachMessageHandler(makeMsg(badPayload));

    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('should expand search radius when initial search returns fewer than 3 providers', async () => {
    const fewProviders = [{ id: 'p-1' }];
    const moreProviders = [{ id: 'p-1' }, { id: 'p-2' }, { id: 'p-3' }];

    const spy = vi
      .spyOn(matchingService, 'findNearbyProviders')
      .mockResolvedValueOnce(fewProviders as any) // initial small radius
      .mockResolvedValueOnce(moreProviders as any); // expanded radius

    vi.spyOn(matchingService, 'calculateDistancesAndSort').mockResolvedValue(
      moreProviders as any
    );

    const insert = makeInsertMock();
    (mockDb.insert as any).mockReturnValue(insert);
    (mockDb.update as any).mockReturnValue(
      makeUpdateMock([{ id: validPayload.requestId }])
    );
    mockDb.query.user.findFirst.mockResolvedValue(null as never);

    await eachMessageHandler(makeMsg(validPayload));

    expect(spy).toHaveBeenCalledTimes(2);
  });
});
