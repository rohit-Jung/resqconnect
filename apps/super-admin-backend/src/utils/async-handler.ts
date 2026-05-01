import type { NextFunction, Request, Response } from 'express';

export type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export type ControllerFn = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

export function asyncHandler(fn: AsyncRequestHandler): ControllerFn {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
