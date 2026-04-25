import { asyncHandler } from '@repo/utils/api';

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

orgsRouter.get('/', asyncHandler(listOrgs));
orgsRouter.get('/:id', asyncHandler(getOrgById));
orgsRouter.delete('/:id', asyncHandler(deleteOrg));
orgsRouter.post('/provision', asyncHandler(provisionOrg));
orgsRouter.post('/:id/status', asyncHandler(updateOrgStatus));
