import { getSectorConfig } from '@repo/config';

import { createServer } from 'node:http';

import 'dotenv/config';

import { envConfig } from '@/config';
import '@/services/kafka/kafka.service';

import { app } from './app';
import { registerSmsWebhook } from './services/sms.service';
import { initializeSocketServer } from './socket';
import { startAllWorkers } from './workers/background.worker';
import { startEmergencyRequestService } from './workers/request.worker';

// now use envconfig which already has cli overrides applied in env.config.ts
const port = Number(envConfig.port);
const host = String(envConfig.dev_ip);
const mode = String(envConfig.mode);
const sector = String(envConfig.sector);

// validate sector early so misconfiguration fails fast.
// Platform runtime is not sector-bound.
if (mode === 'silo') {
  getSectorConfig();
}

function startServer() {
  try {
    const httpServer = createServer(app);
    initializeSocketServer(httpServer);

    httpServer.listen(port, host, () => {
      console.log(
        `[${mode.toUpperCase()}] Server listening on ${host}:${port}`
      );
    });

    if (mode === 'silo') {
      // start kafka consumer for emergency requests
      startEmergencyRequestService().catch(console.log);

      // start background workers (outbox publisher, timeout handler, etc.)
      startAllWorkers();
    }

    // start sms polling worker for offline emergency requests
    // startSMSPollingWorker().catch(console.log);

    // registerSmsWebhook().catch(console.log);
  } catch (error) {
    console.log('Error starting server', error);
  }
}

startServer();
