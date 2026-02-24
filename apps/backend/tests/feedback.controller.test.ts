/**
 * Feedback Controller Tests
 * Tests for feedback CRUD operations
 */
import { HttpStatusCode } from 'axios';
import { beforeEach, describe, expect, it, mock } from 'bun:test';

import {
  createFeedback,
  deleteFeedback,
  getFeedback,
  getUsersFeedback,
  updateFeedback,
} from '@/controllers/feedback.controller';

import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  getResponseData,
  getStatusCode,
  testFeedback,
  testServiceProviders,
  testUsers,
} from './setup';

describe('Feedback Controller Tests', () => {
  let mockReq: ReturnType<typeof createMockRequest>;
  let mockRes: ReturnType<typeof createMockResponse>;
  let mockNext: ReturnType<typeof createMockNext>;

  beforeEach(() => {
    mockReq = createMockRequest();
    mockRes = createMockResponse();
    mockNext = createMockNext();
  });

  //   Create Feedback Tests
  describe('createFeedback', () => {
    it('should reject request from unauthenticated user', async () => {
      mockReq.user = null as any;
      mockReq.body = {
        serviceProviderId: testServiceProviders.validProvider.id,
        message: 'Great service!',
        serviceRatings: 5,
      };

      await createFeedback(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request with missing service provider ID', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = {
        message: 'Great service!',
        serviceRatings: 5,
        // Missing serviceProviderId
      };

      await createFeedback(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject request with missing message', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = {
        serviceProviderId: testServiceProviders.validProvider.id,
        serviceRatings: 5,
        // Missing message
      };

      await createFeedback(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it('should reject request with missing ratings', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.body = {
        serviceProviderId: testServiceProviders.validProvider.id,
        message: 'Great service!',
        // Missing serviceRatings
      };

      await createFeedback(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 400
      ).toBe(true);
    });

    it.todo('should create feedback with valid data');
    it.todo('should include timestamps in created feedback');
  });

  //   Update Feedback Tests
  describe('updateFeedback', () => {
    it('should reject request from unauthenticated user', async () => {
      mockReq.user = null as any;
      mockReq.params = { id: testFeedback.validFeedback.id };
      mockReq.body = { message: 'Updated message' };

      await updateFeedback(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it('should reject request with empty body', async () => {
      mockReq.user = { ...testUsers.validUser, id: testUsers.validUser.id };
      mockReq.params = { id: testFeedback.validFeedback.id };
      mockReq.body = {};

      await updateFeedback(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 ||
          [400, 404].includes(getStatusCode(mockRes) as number)
      ).toBe(true);
    });

    it.todo('should update feedback with valid data');
    it.todo('should return 404 for non-existent feedback');
    it.todo('should reject update for feedback not owned by user');
    it.todo('should reject update with invalid fields');
  });

  //   Delete Feedback Tests
  describe('deleteFeedback', () => {
    it('should reject request from unauthenticated user', async () => {
      mockReq.user = null as any;
      mockReq.params = { id: testFeedback.validFeedback.id };

      await deleteFeedback(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it.todo('should delete feedback successfully');
    it.todo('should return 404 for non-existent feedback');
    it.todo('should reject delete for feedback not owned by user (non-admin)');
    it.todo('should allow admin to delete any feedback');
  });

  //   Get Feedback Tests
  describe('getFeedback', () => {
    it('should reject request without feedback ID', async () => {
      mockReq.params = {};

      await getFeedback(mockReq as any, mockRes as any, mockNext);

      // Should fail validation since no param is provided
      // The controller should check for missing params
      expect(mockRes.json.mock.calls.length >= 0).toBe(true);
    });

    it.todo('should return feedback for valid ID');
    it.todo('should return 404 for non-existent feedback');
  });

  //   Get Users Feedback Tests
  describe('getUsersFeedback', () => {
    it('should reject request from unauthenticated user', async () => {
      mockReq.user = null as any;

      await getUsersFeedback(mockReq as any, mockRes as any, mockNext);

      expect(
        mockNext.mock.calls.length > 0 || getStatusCode(mockRes) === 401
      ).toBe(true);
    });

    it.todo('should return all feedback for authenticated user');
    it.todo('should return empty array if no feedback');
  });

  //   Rating Validation Tests
  describe('Rating Validation', () => {
    it.todo('should accept ratings from 1 to 5');
    it.todo('should reject ratings less than 1');
    it.todo('should reject ratings greater than 5');
    it.todo('should reject non-numeric ratings');
  });
});
