import { Router } from 'express';

import { adminLogin, adminMe } from '@/controllers/auth.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';

export const authRouter = Router();

authRouter.post('/login', adminLogin);
authRouter.get('/me', requireAdminAuth, adminMe);
