import { asyncHandler } from '@repo/utils/api';

import { Router } from 'express';

import { adminLogin, adminMe } from '@/controllers/auth.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';

export const authRouter = Router();

authRouter.post('/login', asyncHandler(adminLogin));
authRouter.get('/me', requireAdminAuth, asyncHandler(adminMe));
