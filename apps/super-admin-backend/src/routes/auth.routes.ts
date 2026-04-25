import { Router } from 'express';

import { adminLogin, adminMe } from '@/controllers/auth.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';
import { asyncHandler } from '@/utils/async-handler';

export const authRouter = Router();

authRouter.post('/login', asyncHandler(adminLogin));
authRouter.get('/me', requireAdminAuth, asyncHandler(adminMe));
