import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { incidentUpdateConsumer } from '@/services/kafka/kafka.service';
import { getIo } from '@/socket';
import { startIncidentUpdateWorker } from '@/workers/incident-update.worker';

import { mockDb, resetMocks } from '../setup';

let eachMessageHandler: (ctx: any) => Promise<void>;

const makeMsg = (payload: object) => ({
  message: { value: Buffer.from(JSON.stringify(payload)), offset: '0' },
});

const base = {
  platformIncidentId: 'incident-001',
  userId: 'user-001',
  requestStatus: 'assigned',
};

describe('incident-update.worker — eachMessage handler', () => {
  beforeEach(async () => {
    resetMocks();

    (incidentUpdateConsumer.run as any).mockImplementationOnce(
      async ({ eachMessage }: any) => {
        eachMessageHandler = eachMessage;
      }
    );

    await startIncidentUpdateWorker();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update platform DB request status when requestStatus is present', async () => {
    (mockDb.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    });

    await eachMessageHandler(
      makeMsg({ ...base, eventType: 'request-accepted' })
    );

    expect(mockDb.update).toHaveBeenCalled();
  });

  it('should skip DB update when requestStatus is absent', async () => {
    const { requestStatus: _, ...noStatus } = base;

    await eachMessageHandler(
      makeMsg({ ...noStatus, eventType: 'request-accepted' })
    );

    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('should emit REQUEST_ACCEPTED event to user socket room', async () => {
    (mockDb.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    });

    await eachMessageHandler(
      makeMsg({
        ...base,
        eventType: 'request-accepted',
        provider: { id: 'p-1', name: 'Driver' },
        message: 'Provider accepted',
      })
    );

    const io = (getIo as any)();
    expect(io.to).toHaveBeenCalledWith(expect.stringContaining('user-001'));
    expect(io.emit).toHaveBeenCalledWith(
      'request-accepted',
      expect.objectContaining({ requestId: base.platformIncidentId })
    );
  });

  it('should emit to PROVIDER room when role is service_provider', async () => {
    (mockDb.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    });

    await eachMessageHandler(
      makeMsg({
        ...base,
        role: 'service_provider',
        eventType: 'request-cancelled',
      })
    );

    const io = (getIo as any)();
    expect(io.to).toHaveBeenCalledWith(expect.stringContaining('provider:'));
  });

  it('should emit REQUEST_COMPLETED event with payload', async () => {
    (mockDb.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    });

    await eachMessageHandler(
      makeMsg({
        ...base,
        requestStatus: 'completed',
        eventType: 'request-completed',
        payload: { completedBy: 'user', completedAt: new Date().toISOString() },
      })
    );

    const io = (getIo as any)();
    expect(io.emit).toHaveBeenCalledWith(
      'request-completed',
      expect.objectContaining({
        requestId: base.platformIncidentId,
        completedBy: 'user',
      })
    );
  });

  it('should emit REQUEST_CANCELLED_NOTIFICATION event', async () => {
    (mockDb.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    });

    await eachMessageHandler(
      makeMsg({
        ...base,
        requestStatus: 'cancelled',
        eventType: 'request-cancelled-notification',
        payload: { cancelledBy: 'user' },
      })
    );

    const io = (getIo as any)();
    expect(io.emit).toHaveBeenCalledWith(
      'request-cancelled-notification',
      expect.objectContaining({ cancelledBy: 'user' })
    );
  });

  it('should silently skip messages with missing required fields', async () => {
    const updateSpy = vi.spyOn(mockDb, 'update' as any);

    await eachMessageHandler(makeMsg({ someField: 'junk' }));

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should skip silently on malformed JSON', async () => {
    const badMsg = {
      message: { value: Buffer.from('not-json'), offset: '0' },
    };

    await eachMessageHandler(badMsg);

    expect(mockDb.update).not.toHaveBeenCalled();
  });
});
