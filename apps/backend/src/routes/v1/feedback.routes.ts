import { Router } from 'express';

import { UserRoles } from '@/constants';
import feedbackController from '@/controllers/feedback.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

const feedbackRouter = Router();

feedbackRouter
  .route('/')
  .post(validateRoleAuth([UserRoles.USER]), feedbackController.createFeedback)
  .get(validateRoleAuth([UserRoles.USER]), feedbackController.getUsersFeedback);

feedbackRouter
  .route('/:id')
  .get(
    validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]),
    feedbackController.getFeedback
  )
  .put(
    validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]),
    feedbackController.updateFeedback
  )
  .delete(
    validateRoleAuth([UserRoles.ADMIN, UserRoles.USER]),
    feedbackController.deleteFeedback
  );

export default feedbackRouter;
