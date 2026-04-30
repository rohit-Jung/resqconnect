import type { TUserRole } from '@repo/db/schemas';
import { serviceProvider, user } from '@repo/db/schemas';

import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

import db from '@/db';
import ApiError from '@/utils/api/ApiError';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { verifyAndDecodeToken } from '@/utils/tokens/jwtTokens';

const validateServiceProvider = asyncHandler(
  async function validateServiceProvider(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const token =
      req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Authentication token required');
    }

    const decoded = await verifyAndDecodeToken(token);
    if (!decoded || decoded == null) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    req.user = decoded;
    next();
  }
);

const validateRoleAuth = (allowedRoles: TUserRole[]) => {
  return asyncHandler(async (req: Request, _, next: NextFunction) => {
    const token =
      req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Authentication token required');
    }

    const decoded = await verifyAndDecodeToken(token);
    if (!decoded || decoded == null) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    if (!allowedRoles.includes(decoded.role as TUserRole)) {
      throw new ApiError(403, 'Not authorized to perform this action');
    }

    req.user = decoded;
    next();
  });
};

const validateOrg = asyncHandler(
  async (req: Request, _, next: NextFunction) => {
    const token =
      req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Authentication token required');
    }

    const decoded = await verifyAndDecodeToken(token);
    if (!decoded || decoded == null) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    req.user = decoded;
    next();
  }
);

const validateUserOrProvider = asyncHandler(
  async (req: Request, _, next: NextFunction) => {
    const token =
      req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(401, 'Authentication token required');
    }

    const decoded = await verifyAndDecodeToken(token);
    if (!decoded || decoded == null) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    req.user = decoded;
    next();
  }
);

export {
  validateServiceProvider,
  validateRoleAuth,
  validateOrg,
  validateUserOrProvider,
};

const validateRequestBody = <T>(schema: ZodSchema<T>) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const parsedValues = schema.safeParse(req.body);

      if (!parsedValues.success) {
        return res
          .status(400)
          .json(ApiError.validationError(parsedValues.error));
      }

      req.body = parsedValues.data;
      next();
    }
  );
};

const validateQueryParams = <T>(schema: ZodSchema<T>) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const parsedValues = schema.safeParse(req.query);

      if (!parsedValues.success) {
        return res
          .status(400)
          .json(ApiError.validationError(parsedValues.error));
      }

      // store validated query in a custom property (req.query is readonly in express 5)
      req.validatedQuery = parsedValues.data;
      next();
    }
  );
};

const validateRouteParams = <T>(schema: ZodSchema<T>) => {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const parsedValues = schema.safeParse(req.params);

      if (!parsedValues.success) {
        return res
          .status(400)
          .json(ApiError.validationError(parsedValues.error));
      }

      // store validated params in a custom property (req.params is readonly in express 5)
      req.validatedParams = parsedValues.data;
      next();
    }
  );
};

const requireAuthenticatedUser = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const loggedInUser = req.user;

    if (!loggedInUser?.id) {
      throw new ApiError(401, 'Unauthorized access');
    }

    const existingUser = await db.query.user.findFirst({
      where: eq(user.id, loggedInUser.id),
      columns: { id: true },
    });

    if (!existingUser) {
      throw new ApiError(400, 'User not found');
    }

    next();
  }
);

const requireAuthenticatedProvider = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const loggedInProvider = req.user;

    if (!loggedInProvider?.id) {
      throw new ApiError(401, 'Unauthorized access');
    }

    const existingProvider = await db.query.serviceProvider.findFirst({
      where: eq(serviceProvider.id, loggedInProvider.id),
      columns: { id: true },
    });

    if (!existingProvider) {
      throw new ApiError(400, 'Provider not found');
    }

    next();
  }
);

export {
  validateRequestBody,
  validateQueryParams,
  validateRouteParams,
  requireAuthenticatedUser,
  requireAuthenticatedProvider,
};
