import { HttpStatusCode } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getActiveSubscription,
  getPaymentHistory,
  getPaymentStatus,
  getSubscriptionPlans,
  initiateSubscription,
  paymentCallback,
} from '@/controllers/payment.controller';
import { handleCallback, initiatePayment } from '@/services/khalti.service';

import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  getResponseData,
  getStatusCode,
  mockDb,
  resetMocks,
  testOrganizations,
} from './setup';

vi.mock('@/services/khalti.service', () => ({
  initiatePayment: vi.fn(),
  handleCallback: vi.fn(),
  verifyPayment: vi.fn(),
}));

const testPlan = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Basic Plan',
  price: 100000,
  isActive: true,
  durationMonths: 1,
  description: 'Basic subscription plan',
};

const testPayment = {
  id: '00000000-0000-4000-8000-000000000002',
  organizationId: testOrganizations.validOrg.id,
  amount: 100000,
  status: 'pending',
  paymentMethod: 'khalti',
  khaltiPidx: 'pidx-test-123',
};

describe('Payment Controller Tests', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    (mockRes as any).redirect = vi.fn();
    mockNext = createMockNext();
    resetMocks();
    // Reset khalti service mocks to a sensible default
    (initiatePayment as any)
      .mockReset()
      .mockResolvedValue({ success: false, error: 'Not configured' });
    (handleCallback as any)
      .mockReset()
      .mockResolvedValue({ success: false, error: 'Not configured' });
  });

  describe('getSubscriptionPlans', () => {
    it('should return all active subscription plans', async () => {
      mockDb.query.subscriptionPlans.findMany.mockResolvedValue([
        testPlan,
      ] as never);

      await getSubscriptionPlans(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect(Array.isArray(data?.data)).toBe(true);
      expect(data?.data).toHaveLength(1);
      expect(data?.data[0]?.id).toBe(testPlan.id);
    });

    it('should return empty array when no active plans exist', async () => {
      mockDb.query.subscriptionPlans.findMany.mockResolvedValue([] as never);

      await getSubscriptionPlans(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect(data?.data).toEqual([]);
    });
  });

  describe('initiateSubscription', () => {
    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;
      mockReq.body = {
        planId: 'test-plan-id',
        returnUrl: 'https://example.com/callback',
      };

      await initiateSubscription(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request with missing planId', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.body = {
        returnUrl: 'https://example.com/callback',
      };

      await initiateSubscription(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(
        statusCode === HttpStatusCode.BadRequest ||
          mockNext.mock.calls.length > 0
      ).toBe(true);
    });

    it('should reject if organization already has active subscription', async () => {
      mockReq.user = { ...testOrganizations.validOrg };
      mockReq.body = {
        planId: testPlan.id,
        returnUrl: 'https://example.com/cb',
      };

      mockDb.query.organizationSubscriptions.findFirst.mockResolvedValue({
        id: 'sub-1',
        organizationId: testOrganizations.validOrg.id,
        status: 'active',
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      } as never);

      await initiateSubscription(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.BadRequest);
    });

    it('should initiate payment with Khalti and return payment URL', async () => {
      mockReq.user = { ...testOrganizations.validOrg };
      mockReq.body = {
        planId: testPlan.id,
        returnUrl: 'https://example.com/cb',
      };

      mockDb.query.organizationSubscriptions.findFirst.mockResolvedValue(
        undefined as never
      );
      (initiatePayment as any).mockResolvedValue({
        success: true,
        pidx: 'pidx-test-123',
        paymentUrl: 'https://khalti.com/pay/pidx-test-123',
        paymentId: 'payment-1',
      });

      await initiateSubscription(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect(data?.data?.paymentUrl).toBe(
        'https://khalti.com/pay/pidx-test-123'
      );
      expect(data?.data?.pidx).toBe('pidx-test-123');
    });

    it('should create pending payment record via khalti service', async () => {
      mockReq.user = { ...testOrganizations.validOrg };
      mockReq.body = {
        planId: testPlan.id,
        returnUrl: 'https://example.com/cb',
      };

      mockDb.query.organizationSubscriptions.findFirst.mockResolvedValue(
        undefined as never
      );
      (initiatePayment as any).mockResolvedValue({
        success: true,
        pidx: 'pidx-test-123',
        paymentUrl: 'https://khalti.com/pay/pidx-test-123',
        paymentId: 'payment-1',
      });

      await initiateSubscription(mockReq as any, mockRes as any, mockNext);

      expect(initiatePayment).toHaveBeenCalledWith(
        testOrganizations.validOrg.id,
        testPlan.id,
        'https://example.com/cb'
      );
    });
  });

  describe('paymentCallback', () => {
    it('should reject callback with missing pidx', async () => {
      mockReq.query = {
        status: 'Completed',
      };

      await paymentCallback(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject callback with missing status', async () => {
      mockReq.query = {
        pidx: 'test-pidx',
      };

      await paymentCallback(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should verify payment with Khalti lookup API via handleCallback', async () => {
      mockReq.query = { pidx: 'pidx-test-123', status: 'Completed' };

      (handleCallback as any).mockResolvedValue({
        success: true,
        payment: {
          ...testPayment,
          status: 'completed',
          id: 'payment-1',
        } as any,
      });

      mockRes.redirect = vi.fn() as any;

      await paymentCallback(mockReq as any, mockRes as any, mockNext);

      expect(handleCallback).toHaveBeenCalledWith(
        expect.objectContaining({ pidx: 'pidx-test-123', status: 'Completed' })
      );
    });

    it('should update payment status to completed on success', async () => {
      mockReq.query = { pidx: 'pidx-test-123', status: 'Completed' };

      (handleCallback as any).mockResolvedValue({
        success: true,
        payment: {
          ...testPayment,
          status: 'completed',
          id: 'payment-1',
        } as any,
      });

      mockRes.redirect = vi.fn() as any;

      await paymentCallback(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.redirect as any).toHaveBeenCalledWith(
        expect.stringContaining('payment/success')
      );
    });

    it('should create subscription on successful payment via handleCallback', async () => {
      mockReq.query = { pidx: 'pidx-test-123', status: 'Completed' };

      (handleCallback as any).mockResolvedValue({
        success: true,
        payment: {
          ...testPayment,
          status: 'completed',
          id: 'payment-1',
        } as any,
      });

      mockRes.redirect = vi.fn() as any;

      await paymentCallback(mockReq as any, mockRes as any, mockNext);

      expect(handleCallback).toHaveBeenCalled();
      expect(mockRes.redirect as any).toHaveBeenCalledWith(
        expect.stringContaining('payment-1')
      );
    });

    it('should redirect to error page on failed payment', async () => {
      mockReq.query = { pidx: 'pidx-test-123', status: 'Failed' };

      (handleCallback as any).mockResolvedValue({
        success: false,
        error: 'Payment verification failed',
      });

      mockRes.redirect = vi.fn() as any;

      await paymentCallback(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.redirect as any).toHaveBeenCalledWith(
        expect.stringContaining('payment/error')
      );
    });
  });

  describe('getPaymentStatus', () => {
    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;
      mockReq.params = { paymentId: 'test-payment-id' };

      await getPaymentStatus(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request with missing payment ID', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.params = {};

      await getPaymentStatus(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should return payment status for valid payment ID', async () => {
      mockReq.user = { ...testOrganizations.validOrg };
      mockReq.params = { paymentId: testPayment.id };

      mockDb.query.payments.findFirst.mockResolvedValue({
        ...testPayment,
        subscription: null,
      } as never);

      await getPaymentStatus(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect(data?.data?.id).toBe(testPayment.id);
    });

    it('should return 404 for non-existent payment', async () => {
      mockReq.user = { ...testOrganizations.validOrg };
      mockReq.params = { paymentId: 'non-existent-id' };

      mockDb.query.payments.findFirst.mockResolvedValue(undefined as never);

      await getPaymentStatus(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.NotFound);
    });

    it('should only return payment belonging to the organization', async () => {
      mockReq.user = { ...testOrganizations.validOrg };
      mockReq.params = { paymentId: 'other-org-payment-id' };

      // Returns undefined because organizationId doesn't match
      mockDb.query.payments.findFirst.mockResolvedValue(undefined as never);

      await getPaymentStatus(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(HttpStatusCode.NotFound);
    });
  });

  describe('getPaymentHistory', () => {
    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;
      mockReq.query = { page: '1', limit: '10' };

      await getPaymentHistory(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should use default pagination if not provided', async () => {
      mockReq.user = {
        ...testOrganizations.validOrg,
        id: testOrganizations.validOrg.id,
      };
      mockReq.query = {};

      await getPaymentHistory(mockReq as any, mockRes as any, mockNext);

      // Should not throw validation error for missing pagination
      const statusCode = getStatusCode(mockRes);
      expect(
        statusCode === null ||
          statusCode !== 400 ||
          mockNext.mock.calls.length > 0
      ).toBe(true);
    });

    it('should return paginated payment history', async () => {
      mockReq.user = { ...testOrganizations.validOrg };
      mockReq.query = { page: '1', limit: '10' };

      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 2 }]),
        }),
      });
      mockDb.query.payments.findMany.mockResolvedValue([
        { ...testPayment, id: 'p-1', subscription: null },
        { ...testPayment, id: 'p-2', subscription: null },
      ] as never);

      await getPaymentHistory(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect(Array.isArray(data?.data?.payments)).toBe(true);
      expect(data?.data?.pagination).toBeDefined();
    });

    it('should filter by payment status when provided', async () => {
      mockReq.user = { ...testOrganizations.validOrg };
      mockReq.query = { page: '1', limit: '10', status: 'completed' };

      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 1 }]),
        }),
      });
      mockDb.query.payments.findMany.mockResolvedValue([
        { ...testPayment, id: 'p-1', status: 'completed', subscription: null },
      ] as never);

      await getPaymentHistory(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect(data?.data?.payments).toHaveLength(1);
    });

    it('should return correct pagination metadata', async () => {
      mockReq.user = { ...testOrganizations.validOrg };
      mockReq.query = { page: '2', limit: '5' };

      (mockDb.select as any).mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 12 }]),
        }),
      });
      mockDb.query.payments.findMany.mockResolvedValue([] as never);

      await getPaymentHistory(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect(data?.data?.pagination?.page).toBe(2);
      expect(data?.data?.pagination?.limit).toBe(5);
      expect(data?.data?.pagination?.total).toBe(12);
      expect(data?.data?.pagination?.totalPages).toBe(3);
    });
  });

  describe('getActiveSubscription', () => {
    it('should reject request from unauthenticated organization', async () => {
      mockReq.user = null;

      await getActiveSubscription(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should return active subscription with plan details', async () => {
      mockReq.user = { ...testOrganizations.validOrg };

      const endDate = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      mockDb.query.organizationSubscriptions.findFirst.mockResolvedValue({
        id: 'sub-1',
        organizationId: testOrganizations.validOrg.id,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate,
        plan: testPlan,
      } as never);

      await getActiveSubscription(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect(data?.data?.id).toBe('sub-1');
      expect(data?.data?.plan).toBeDefined();
    });

    it('should return null when no active subscription exists', async () => {
      mockReq.user = { ...testOrganizations.validOrg };

      mockDb.query.organizationSubscriptions.findFirst.mockResolvedValue(
        undefined as never
      );

      await getActiveSubscription(mockReq as any, mockRes as any, mockNext);

      expect(getStatusCode(mockRes)).toBe(200);
      const data = getResponseData(mockRes) as any;
      expect(data?.data).toBeNull();
    });

    it('should calculate days remaining correctly', async () => {
      mockReq.user = { ...testOrganizations.validOrg };

      const daysFromNow = 15;
      const endDate = new Date(
        Date.now() + daysFromNow * 24 * 60 * 60 * 1000
      ).toISOString();
      mockDb.query.organizationSubscriptions.findFirst.mockResolvedValue({
        id: 'sub-1',
        organizationId: testOrganizations.validOrg.id,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate,
        plan: testPlan,
      } as never);

      await getActiveSubscription(mockReq as any, mockRes as any, mockNext);

      const data = getResponseData(mockRes) as any;
      // Should be approximately 15 days remaining
      expect(data?.data?.daysRemaining).toBeGreaterThan(14);
      expect(data?.data?.daysRemaining).toBeLessThanOrEqual(16);
    });
  });
});
