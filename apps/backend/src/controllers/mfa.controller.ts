import type { Request, Response } from 'express';

import { issueMfaToken } from '@/services/mfa.service';
import { redis } from '@/services/redis.service';
import ApiError from '@/utils/api/ApiError';
import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { sendOTP } from '@/utils/services/email';

const MFA_OTP_TTL_SECONDS = 600;

const otpKey = (userId: string) => `mfa_otp:${userId}`;

export const requestMfaOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const u = req.user;
    if (!u?.id || !u.email) throw new ApiError(401, 'Unauthorized');

    const otpToken = await sendOTP(u.email);
    if (!otpToken) throw new ApiError(500, 'Failed to generate OTP');

    await redis.set(otpKey(u.id), otpToken, 'EX', MFA_OTP_TTL_SECONDS);

    const payload: Record<string, unknown> = { sent: true };
    if (process.env.NODE_ENV !== 'production') {
      payload.otpToken = otpToken;
    }

    res.status(200).json(new ApiResponse(200, 'MFA OTP sent', payload));
  }
);

export const verifyMfaOtp = asyncHandler(
  async (req: Request, res: Response) => {
    const u = req.user;
    if (!u?.id) throw new ApiError(401, 'Unauthorized');

    const { otpToken } = (req.body ?? {}) as { otpToken?: unknown };
    if (typeof otpToken !== 'string' || otpToken.length === 0) {
      throw new ApiError(400, 'OTP token is required');
    }

    const expected = await redis.get(otpKey(u.id));
    if (!expected) throw new ApiError(400, 'OTP expired');
    if (expected !== otpToken) throw new ApiError(400, 'Invalid OTP');

    await redis.del(otpKey(u.id));
    const token = await issueMfaToken({ userId: u.id });

    res.status(200).json(
      new ApiResponse(200, 'MFA verified', {
        token,
        header: 'x-mfa-token',
        expiresInSeconds: 300,
      })
    );
  }
);

const mfaController = { requestMfaOtp, verifyMfaOtp } as const;

export default mfaController;
