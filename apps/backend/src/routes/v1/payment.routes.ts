import { Router } from 'express';

import ApiResponse from '@/utils/api/ApiResponse';

const paymentRouter = Router();

// keep the route mounted for backwards-compat during migration, but return a hard failure.
paymentRouter.use((_req, res) => {
  return res
    .status(410)
    .json(
      new ApiResponse(
        410,
        'Billing has moved to control plane. This silo no longer serves payment routes.',
        null
      )
    );
});

export default paymentRouter;
