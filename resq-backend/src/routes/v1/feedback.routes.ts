import { Router } from 'express';

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
  .post(validateRoleAuth(['user']), createFeedback)
  .get(validateRoleAuth(['user']), getUsersFeedback);

feedbackRouter
  .route('/:id')
  .get(getFeedback)
  .put(validateRoleAuth(['user', 'admin']), updateFeedback)
  .delete(validateRoleAuth(['admin', 'user']), deleteFeedback);

export default feedbackRouter;
