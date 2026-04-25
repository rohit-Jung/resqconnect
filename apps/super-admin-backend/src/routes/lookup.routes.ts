import { Router } from 'express';

import {
  listOrgsForLookup,
  lookupOrgByName,
} from '@/controllers/lookup.controller';

export const lookupRouter = Router();

// Mobile responder lookup: resolve org name -> sector + silo URL + orgId.
lookupRouter.get('/org', lookupOrgByName);

// Mobile responder lookup: list orgs for sector picker.
lookupRouter.get('/orgs', listOrgsForLookup);
