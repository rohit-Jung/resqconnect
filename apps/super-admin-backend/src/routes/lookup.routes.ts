import { asyncHandler } from '@repo/utils/api';

import { Router } from 'express';

import {
  listOrgsForLookup,
  lookupOrgByNameOrId,
} from '@/controllers/lookup.controller';

export const lookupRouter = Router();

lookupRouter.get('/org', asyncHandler(lookupOrgByNameOrId));

lookupRouter.get('/orgs', asyncHandler(listOrgsForLookup));
