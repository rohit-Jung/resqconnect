import { asyncHandler } from '@repo/utils/api';

import { Router } from 'express';

import {
  getCompliance,
  updateCompliance,
} from '@/controllers/compliance.controller';
import {
  bulkProvisionOrgs,
  deleteOrg,
  getOrgById,
  listOrgs,
  provisionOrg,
  updateOrg,
  updateOrgStatus,
} from '@/controllers/orgs.controller';
import { requireAdminAuth } from '@/middlewares/admin-auth.middleware';

export const orgsRouter = Router();

orgsRouter.use(requireAdminAuth);

orgsRouter.get('/', asyncHandler(listOrgs));
orgsRouter.get('/:id', asyncHandler(getOrgById));
orgsRouter.delete('/:id', asyncHandler(deleteOrg));
orgsRouter.patch('/:id', asyncHandler(updateOrg));
orgsRouter.post('/provision', asyncHandler(provisionOrg));
orgsRouter.post('/bulk-provision', asyncHandler(bulkProvisionOrgs));
orgsRouter.post('/:id/status', asyncHandler(updateOrgStatus));
orgsRouter.get('/:id/compliance', asyncHandler(getCompliance));
orgsRouter.put('/:id/compliance', asyncHandler(updateCompliance));
