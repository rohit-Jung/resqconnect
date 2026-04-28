import { asyncHandler } from '@repo/utils/api';

import { Router } from 'express';

import {
  listOrgsForLookup,
  lookupOrgByName,
} from '@/controllers/lookup.controller';

export const lookupRouter = Router();

lookupRouter.get('/org', asyncHandler(lookupOrgByName));

lookupRouter.get('/orgs', asyncHandler(listOrgsForLookup));
