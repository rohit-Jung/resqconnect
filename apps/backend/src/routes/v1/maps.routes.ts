import { Router } from 'express';

import { mapsRouteLimiter } from '@/config';
import { UserRoles } from '@/constants';
import mapsController from '@/controllers/maps.controller';
import {
  validateRoleAuth,
  validateUserOrProvider,
} from '@/middlewares/auth.middleware';

const mapsRouter = Router();

mapsRouter
  .route('/autocomplete')
  .get(
    validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]),
    mapsController.autocomplete
  );

mapsRouter
  .route('/optimal-route')
  .post(mapsRouteLimiter, validateUserOrProvider, mapsController.route);

export default mapsRouter;
