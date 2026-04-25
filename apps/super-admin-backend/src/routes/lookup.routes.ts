import { Router } from 'express';

import {
  listOrgsForLookup,
  lookupOrgByName,
} from '@/controllers/lookup.controller';
import { asyncHandler } from '@/utils/async-handler';

export const lookupRouter = Router();

lookupRouter.get('/org', asyncHandler(lookupOrgByName));

lookupRouter.get('/orgs', asyncHandler(listOrgsForLookup));
