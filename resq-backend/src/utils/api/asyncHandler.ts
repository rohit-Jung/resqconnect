import type { NextFunction, Request, Response } from 'express';

import ApiError from './ApiError';

export function asyncHandler(
  fnc: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | void
) {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      await fnc(req, res, next);
    } catch (error: any) {
      console.log('Error caught in asyncHandler', error);
      const stack = error.stack || '';

      res
        .status(error.statusCode || 500)
        .json(new ApiError(error.statusCode || 500, error.message, [], null, stack));
    }
  };
}
