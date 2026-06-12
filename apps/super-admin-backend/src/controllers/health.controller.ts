import { ApiResponse, asyncHandler } from '@repo/utils/api';

import type { Request, Response } from 'express';

import { db } from '@/db';

export const healthcheck = asyncHandler(
  async (_req: Request, res: Response) => {
    res.status(200).json(new ApiResponse(200, 'OK', { status: 'healthy' }));
  }
);

export const dbHealthcheck = asyncHandler(
  async (_req: Request, res: Response) => {
    try {
      const info = await db.execute('SELECT 1 AS ok');
      res.status(200).json(new ApiResponse(200, 'OK', { db: info }));
    } catch (e) {
      res
        .status(200)
        .json(new ApiResponse(200, 'OK', { db: null, error: String(e) }));
    }
  }
);
