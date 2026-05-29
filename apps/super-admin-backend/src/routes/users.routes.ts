import { asyncHandler } from '@repo/utils/api';

import { Router } from 'express';

import { listUsers } from '@/controllers/users.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';

export const usersRouter = Router();

usersRouter.use(requireAdminAuth);

usersRouter.get('/', asyncHandler(listUsers));
