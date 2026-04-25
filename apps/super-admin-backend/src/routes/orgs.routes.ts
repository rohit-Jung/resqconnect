import { Router } from 'express';

import {
  deleteOrg,
  getOrgById,
  listOrgs,
  provisionOrg,
  updateOrgStatus,
} from '@/controllers/orgs.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';

export const orgsRouter = Router();

orgsRouter.use(requireAdminAuth);

orgsRouter.get('/', listOrgs);
orgsRouter.get('/:id', getOrgById);
orgsRouter.delete('/:id', deleteOrg);
orgsRouter.post('/provision', provisionOrg);
orgsRouter.post('/:id/status', updateOrgStatus);
