import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

import {
  type CallbackParams,
  handleCallback,
  initiatePayment,
  verifyPayment,
} from '@/services/khalti.service';

describe('Khalti Service Tests', () => {
  describe('initiatePayment', () => {
    it.todo('should return error for non-existent plan');
    it.todo('should return error for inactive plan');
    it.todo('should create pending payment record');
    it.todo('should call Khalti initiate API with correct payload');
    it.todo('should update payment with pidx on success');
    it.todo('should update payment status to failed on Khalti error');
    it.todo('should return payment URL and pidx on success');
  });

  describe('verifyPayment', () => {
    it.todo('should call Khalti lookup API with correct pidx');
    it.todo('should return payment status from Khalti');
    it.todo('should return error on Khalti API failure');
    it.todo('should return transaction ID and amount on success');
  });

  describe('handleCallback', () => {
    it.todo('should return error for non-existent payment');
    it.todo('should return early if payment already completed');
    it.todo('should verify payment with Khalti lookup API');
    it.todo('should update payment status to completed on success');
    it.todo('should update payment status to failed on expired');
    it.todo('should update payment status to refunded when refunded');
    it.todo('should create subscription on completed payment');
    it.todo('should update payment with subscription ID');
  });
});
