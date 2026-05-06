import { Router } from 'express';

import { UserRoles } from '@/constants';
import feedbackController from '@/controllers/feedback.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

const feedbackRouter = Router();

feedbackRouter
  .route('/')
  .post(validateRoleAuth([UserRoles.USER]), feedbackController.create)
  .get(validateRoleAuth([UserRoles.USER]), feedbackController.getForUser);

feedbackRouter
  .route('/:id')
  .get(
    validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]),
    feedbackController.getById
  )
  .put(
    validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]),
    feedbackController.update
  )
  .delete(
    validateRoleAuth([UserRoles.ADMIN, UserRoles.USER]),
    feedbackController.remove
  );

export default feedbackRouter;
