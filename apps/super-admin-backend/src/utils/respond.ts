import { ApiResponse } from '@repo/utils/api';

import type { Response } from 'express';

export function ok<T>(res: Response, data: T, message = 'OK', status = 200) {
  return res.status(status).json(new ApiResponse(status, message, data));
}

export function fail(res: Response, message: string, status = 400) {
  return res.status(status).json(new ApiResponse(status, message, null));
}
