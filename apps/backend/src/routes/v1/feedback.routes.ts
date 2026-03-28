import { Router } from 'express';

import { UserRoles } from '@/constants';
import {
  createFeedback,
  deleteFeedback,
  getFeedback,
  getUsersFeedback,
  updateFeedback,
} from '@/controllers/feedback.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

const feedbackRouter = Router();

feedbackRouter
  .route('/')
  .post(validateRoleAuth([UserRoles.USER]), createFeedback)
  .get(validateRoleAuth([UserRoles.USER]), getUsersFeedback);

feedbackRouter
  .route('/:id')
  .get(validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]), getFeedback)
  .put(validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]), updateFeedback)
  .delete(validateRoleAuth([UserRoles.ADMIN, UserRoles.USER]), deleteFeedback);

export default feedbackRouter;
