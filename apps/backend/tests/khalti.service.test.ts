import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type CallbackParams,
  handleCallback,
  initiatePayment,
  verifyPayment,
} from '@/services/khalti.service';

import { mockDb, resetMocks } from './setup';

const testPlan = {
  id: 'plan-1',
  name: 'Basic Plan',
  price: 100000,
  isActive: true,
  durationMonths: 1,
};

const testPayment = {
  id: 'payment-1',
  organizationId: 'org-1',
  amount: 100000,
  status: 'pending',
  paymentMethod: 'khalti',
  khaltiPidx: 'pidx-test-123',
};

describe('Khalti Service Tests', () => {
  beforeEach(() => {
    resetMocks();
    // Reset fetch mock between tests
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('initiatePayment', () => {
    it('should return error for non-existent plan', async () => {
      mockDb.query.subscriptionPlans.findFirst.mockResolvedValue(
        undefined as never
      );

      const result = await initiatePayment('org-1', 'non-existent-plan-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('plan not found');
    });

    it('should return error for inactive plan', async () => {
      mockDb.query.subscriptionPlans.findFirst.mockResolvedValue({
        ...testPlan,
        isActive: false,
      } as never);

      const result = await initiatePayment('org-1', testPlan.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not active');
    });

    it('should create pending payment record', async () => {
      mockDb.query.subscriptionPlans.findFirst.mockResolvedValue(
        testPlan as never
      );
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([testPayment]),
        }),
      });
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
      });

      // Khalti API succeeds
      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          pidx: 'pidx-test-123',
          payment_url: 'https://khalti.com/pay/pidx-test-123',
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          expires_in: 3600,
        }),
      });

      const result = await initiatePayment('org-1', testPlan.id);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.paymentId).toBe(testPayment.id);
    });

    it('should call Khalti initiate API with correct payload', async () => {
      mockDb.query.subscriptionPlans.findFirst.mockResolvedValue(
        testPlan as never
      );
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([testPayment]),
        }),
      });
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
      });

      const khaltiResponse = {
        pidx: 'pidx-test-123',
        payment_url: 'https://khalti.com/pay/pidx-test-123',
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        expires_in: 3600,
      };
      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(khaltiResponse),
      });

      await initiatePayment('org-1', testPlan.id, 'https://example.com/cb');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('epayment/initiate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: expect.stringContaining('Key'),
          }),
        })
      );
    });

    it('should update payment with pidx on success', async () => {
      mockDb.query.subscriptionPlans.findFirst.mockResolvedValue(
        testPlan as never
      );
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([testPayment]),
        }),
      });
      const setMock = vi
        .fn()
        .mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
      (mockDb.update as any).mockReturnValue({ set: setMock });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          pidx: 'pidx-test-123',
          payment_url: 'https://khalti.com/pay/pidx-test-123',
          expires_at: new Date().toISOString(),
          expires_in: 3600,
        }),
      });

      await initiatePayment('org-1', testPlan.id);

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({ khaltiPidx: 'pidx-test-123' })
      );
    });

    it('should update payment status to failed on Khalti error', async () => {
      mockDb.query.subscriptionPlans.findFirst.mockResolvedValue(
        testPlan as never
      );
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([testPayment]),
        }),
      });
      const setMock = vi
        .fn()
        .mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
      (mockDb.update as any).mockReturnValue({ set: setMock });

      (fetch as any).mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ detail: 'Invalid credentials' }),
      });

      const result = await initiatePayment('org-1', testPlan.id);

      expect(result.success).toBe(false);
      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed' })
      );
    });

    it('should return payment URL and pidx on success', async () => {
      mockDb.query.subscriptionPlans.findFirst.mockResolvedValue(
        testPlan as never
      );
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([testPayment]),
        }),
      });
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
      });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          pidx: 'pidx-test-123',
          payment_url: 'https://khalti.com/pay/pidx-test-123',
          expires_at: new Date().toISOString(),
          expires_in: 3600,
        }),
      });

      const result = await initiatePayment('org-1', testPlan.id);

      expect(result.success).toBe(true);
      expect(result.pidx).toBe('pidx-test-123');
      expect(result.paymentUrl).toBe('https://khalti.com/pay/pidx-test-123');
    });
  });

  describe('verifyPayment', () => {
    it('should call Khalti lookup API with correct pidx', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          pidx: 'pidx-test-123',
          total_amount: 100000,
          status: 'Completed',
          transaction_id: 'txn-001',
          fee: 0,
          refunded: false,
        }),
      });

      await verifyPayment('pidx-test-123');

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('epayment/lookup'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('pidx-test-123'),
        })
      );
    });

    it('should return payment status from Khalti', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          pidx: 'pidx-test-123',
          total_amount: 100000,
          status: 'Completed',
          transaction_id: 'txn-001',
          fee: 0,
          refunded: false,
        }),
      });

      const result = await verifyPayment('pidx-test-123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('Completed');
    });

    it('should return error on Khalti API failure', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ detail: 'Invalid pidx' }),
      });

      const result = await verifyPayment('invalid-pidx');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return transaction ID and amount on success', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          pidx: 'pidx-test-123',
          total_amount: 100000,
          status: 'Completed',
          transaction_id: 'txn-001',
          fee: 0,
          refunded: false,
        }),
      });

      const result = await verifyPayment('pidx-test-123');

      expect(result.transactionId).toBe('txn-001');
      expect(result.amount).toBe(100000);
    });
  });

  describe('handleCallback', () => {
    const validParams: CallbackParams = {
      pidx: 'pidx-test-123',
      status: 'Completed',
      transaction_id: 'txn-001',
      purchase_order_id: testPayment.id,
    };

    it('should return error for non-existent payment', async () => {
      mockDb.query.payments.findFirst.mockResolvedValue(undefined as never);

      const result = await handleCallback(validParams);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should return early if payment already completed', async () => {
      mockDb.query.payments.findFirst.mockResolvedValue({
        ...testPayment,
        status: 'completed',
      } as never);

      const result = await handleCallback(validParams);

      // Returns early with success=true, no verify call needed
      expect(result.success).toBe(true);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should verify payment with Khalti lookup API', async () => {
      mockDb.query.payments.findFirst.mockResolvedValue(testPayment as never);
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ ...testPayment, status: 'completed' }]),
          }),
        }),
      });
      mockDb.query.subscriptionPlans.findFirst.mockResolvedValue(
        testPlan as never
      );
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'sub-1' }]),
        }),
      });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          pidx: 'pidx-test-123',
          total_amount: 100000,
          status: 'Completed',
          transaction_id: 'txn-001',
          fee: 0,
          refunded: false,
        }),
      });

      await handleCallback(validParams);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('epayment/lookup'),
        expect.any(Object)
      );
    });

    it('should update payment status to completed on success', async () => {
      mockDb.query.payments.findFirst.mockResolvedValue(testPayment as never);
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([{ ...testPayment, status: 'completed' }]),
        }),
      });
      (mockDb.update as any).mockReturnValue({ set: setMock });
      mockDb.query.subscriptionPlans.findFirst.mockResolvedValue(
        testPlan as never
      );
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'sub-1' }]),
        }),
      });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          pidx: 'pidx-test-123',
          total_amount: 100000,
          status: 'Completed',
          transaction_id: 'txn-001',
          fee: 0,
          refunded: false,
        }),
      });

      await handleCallback(validParams);

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' })
      );
    });

    it('should update payment status to failed on expired', async () => {
      mockDb.query.payments.findFirst.mockResolvedValue(testPayment as never);
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([{ ...testPayment, status: 'failed' }]),
        }),
      });
      (mockDb.update as any).mockReturnValue({ set: setMock });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          pidx: 'pidx-test-123',
          total_amount: 100000,
          status: 'Expired',
          transaction_id: '',
          fee: 0,
          refunded: false,
        }),
      });

      await handleCallback({ ...validParams, status: 'Expired' });

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'failed' })
      );
    });

    it('should update payment status to refunded when refunded', async () => {
      mockDb.query.payments.findFirst.mockResolvedValue(testPayment as never);
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([{ ...testPayment, status: 'refunded' }]),
        }),
      });
      (mockDb.update as any).mockReturnValue({ set: setMock });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          pidx: 'pidx-test-123',
          total_amount: 100000,
          status: 'Refunded',
          transaction_id: 'txn-001',
          fee: 0,
          refunded: true,
        }),
      });

      await handleCallback({ ...validParams, status: 'Refunded' });

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'refunded' })
      );
    });

    it('should create subscription on completed payment', async () => {
      mockDb.query.payments.findFirst.mockResolvedValue(testPayment as never);
      (mockDb.update as any).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ ...testPayment, status: 'completed' }]),
          }),
        }),
      });
      mockDb.query.subscriptionPlans.findFirst.mockResolvedValue(
        testPlan as never
      );
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'sub-1' }]),
        }),
      });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          pidx: 'pidx-test-123',
          total_amount: 100000,
          status: 'Completed',
          transaction_id: 'txn-001',
          fee: 0,
          refunded: false,
        }),
      });

      await handleCallback(validParams);

      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should update payment with subscription ID', async () => {
      mockDb.query.payments.findFirst.mockResolvedValue(testPayment as never);
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([{ ...testPayment, status: 'completed' }]),
        }),
      });
      (mockDb.update as any).mockReturnValue({ set: setMock });
      mockDb.query.subscriptionPlans.findFirst.mockResolvedValue(
        testPlan as never
      );
      (mockDb.insert as any).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'sub-new-1' }]),
        }),
      });

      (fetch as any).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          pidx: 'pidx-test-123',
          total_amount: 100000,
          status: 'Completed',
          transaction_id: 'txn-001',
          fee: 0,
          refunded: false,
        }),
      });

      await handleCallback(validParams);

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({ subscriptionId: 'sub-new-1' })
      );
    });
  });
});
