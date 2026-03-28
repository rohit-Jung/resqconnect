import { Router } from 'express';

import { UserRoles } from '@/constants';
import { getDashboardAnalytics } from '@/controllers/admin.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

const adminRouter = Router();

adminRouter
  .route('/dashboard-analytics')
  .get(validateRoleAuth([UserRoles.ADMIN]), getDashboardAnalytics);

export default adminRouter;
