import { Router } from 'express';

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
    mapsController.getAutoComplete
  );

mapsRouter
  .route('/optimal-route')
  .post(validateUserOrProvider, mapsController.getRoute);

export default mapsRouter;
