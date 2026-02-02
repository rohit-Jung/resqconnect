import { w } from '@faker-js/faker/dist/airline-DF6RqYmq';

import { Router } from 'express';

import { UserRoles } from '@/constants';
// import {
//   getNotifications,
//   markAsRead,
// } from '@/controllers/notification.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

const router = Router();

const authenticateUser = validateRoleAuth([UserRoles.USER]);
// router.post('/', authenticateUser, getNotifications);
// router.put('/:id/read', authenticateUser, markAsRead);
router.post('/token', authenticateUser);

export default router;
