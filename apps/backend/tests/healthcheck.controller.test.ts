import { HttpStatusCode } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';

import { healthCheck } from '@/controllers/healthcheck.controller';

import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  getResponseData,
  getStatusCode,
} from './setup';

describe('Healthcheck Controller Tests', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  describe('healthCheck', () => {
    it('should return 200 status', async () => {
      await healthCheck(mockReq as any, mockRes as any, mockNext);

      const statusCode = getStatusCode(mockRes);
      expect(statusCode).toBe(HttpStatusCode.Ok);
    });

    it('should return success message', async () => {
      await healthCheck(mockReq as any, mockRes as any, mockNext);

      const response = getResponseData(mockRes) as { message?: string } | null;
      expect(response).toBeDefined();
      expect(response?.message).toContain('running');
    });

    it('should return ApiResponse format', async () => {
      await healthCheck(mockReq as any, mockRes as any, mockNext);

      const response = getResponseData(mockRes) as Record<
        string,
        unknown
      > | null;
      expect(response).toHaveProperty('statusCode');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('data');
    });
  });
});
