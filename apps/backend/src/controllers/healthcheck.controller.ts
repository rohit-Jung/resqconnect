import type { Request, Response } from 'express';

import ApiResponse from '@/utils/api/ApiResponse';
import { asyncHandler } from '@/utils/api/asyncHandler';
import { getSMSWorkerHealth } from '@/workers/messaging.worker';

const healthCheck = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json(new ApiResponse(200, 'Server is up and running', {}));
});

const workerHealthCheck = asyncHandler(async (req: Request, res: Response) => {
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

export { healthCheck, workerHealthCheck };
