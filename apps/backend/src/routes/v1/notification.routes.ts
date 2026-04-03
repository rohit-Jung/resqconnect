import { Router } from 'express';

import { UserRoles } from '@/constants';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

const router = Router();

const authenticateUser = validateRoleAuth([UserRoles.USER]);
router.post('/token', authenticateUser);

export default router;
