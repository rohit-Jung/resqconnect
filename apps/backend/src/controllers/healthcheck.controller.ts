import type { Request, Response } from 'express';

import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';

const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, 'Server is up and running', {}));
});

const workerHealthCheck = asyncHandler(async (req: Request, res: Response) => {
  // Lazy import to avoid pulling in worker deps during tests.
  const { getSMSWorkerHealth } = await import('@/workers/messaging.worker');
  const smsWorkerHealth = getSMSWorkerHealth();

  const healthStatus = {
    timestamp: new Date().toISOString(),
    workers: {
      sms_polling: smsWorkerHealth,
    },
  };

  const isHealthy =
    smsWorkerHealth.status === 'running' && smsWorkerHealth.isHealthy;
  const statusCode = isHealthy ? 200 : 503;
  const message = isHealthy
    ? 'All workers are healthy'
    : 'Some workers have issues';

  res
    .status(statusCode)
    .json(new ApiResponse(statusCode, message, healthStatus));
});

const healthcheckController = { healthCheck, workerHealthCheck } as const;

export default healthcheckController;

export { healthCheck, workerHealthCheck };
