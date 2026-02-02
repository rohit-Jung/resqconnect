import { Router } from 'express';

import { getAutoComplete } from '@/controllers/maps.controller';
import { validateRoleAuth } from '@/middlewares/auth.middleware';

const mapsRouter = Router();

mapsRouter.route('/autocomplete').get(validateRoleAuth(['user', 'admin']), getAutoComplete);

mapsRouter.route('/optimal-route').get(validateRoleAuth(['user', 'admin']));

export default mapsRouter;
