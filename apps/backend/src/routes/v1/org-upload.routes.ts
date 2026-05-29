import express from 'express';

import orgUploadController from '@/controllers/org-upload.controller';
import { validateOrg } from '@/middlewares/auth.middleware';

const orgUploadRouter = express.Router();

orgUploadRouter.get(
  '/signature',
  validateOrg,
  orgUploadController.getSignature
);
orgUploadRouter.put('/logo', validateOrg, orgUploadController.updateLogo);
orgUploadRouter.delete('/logo', validateOrg, orgUploadController.deleteLogo);

export default orgUploadRouter;
