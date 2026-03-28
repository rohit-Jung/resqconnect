import { Router } from 'express';

import { UserRoles } from '@/constants';
import { getAutoComplete, getRoute } from '@/controllers/maps.controller';
import {
  validateRoleAuth,
  validateUserOrProvider,
} from '@/middlewares/auth.middleware';

const mapsRouter = Router();

mapsRouter
  .route('/autocomplete')
  .get(validateRoleAuth([UserRoles.USER, UserRoles.ADMIN]), getAutoComplete);

mapsRouter.route('/optimal-route').post(validateUserOrProvider, getRoute);

export default mapsRouter;
