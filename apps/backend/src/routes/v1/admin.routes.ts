import { Router } from 'express';

import { getDashboardAnalytics } from '@/controllers/admin.controller';

const adminRouter = Router();

adminRouter.route('/dashboard-analytics').get(getDashboardAnalytics);

export default adminRouter;
