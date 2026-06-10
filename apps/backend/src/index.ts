import { getSectorConfig, loadTenantConfig } from '@repo/config';

import { createServer } from 'node:http';

import 'dotenv/config';

import { envConfig, logger } from '@/config';
import '@/services/kafka/kafka.service';

import { app } from './app';
import { registerSiloWithControlPlane } from './services/silo-registration.service';
import { registerSmsWebhook } from './services/sms.service';
import { initializeSocketServer } from './socket';
import { startAllWorkers } from './workers/background.worker';
import { startIncidentUpdateWorker } from './workers/incident-update.worker';
import { startEmergencyRequestService } from './workers/request.worker';

// now use envconfig which already has cli overrides applied in env.config.ts
const port = Number(envConfig.port);
const host = String(envConfig.dev_ip);
const mode = String(envConfig.mode);
// For silo mode, try to load tenant config from CP (TENANT_ID).
// Falls back to SECTOR env var if TENANT_ID is not set.
const startupPromise = (async () => {
  if (mode === 'silo') {
    try {
      await loadTenantConfig();
      logger.info('[BOOT] Tenant config loaded');
    } catch (err: any) {
      logger.warn(
        `[BOOT] Tenant config load failed, using SECTOR fallback: ${err.message}`
      );
      getSectorConfig(); // fallback
    }
    registerSiloWithControlPlane();
  }
})().catch(err => {
  logger.error('[BOOT] Fatal startup error:', err);
  process.exit(1);
});

function startServer() {
  try {
    const httpServer = createServer(app);
    initializeSocketServer(httpServer);

    httpServer.listen(port, host, () => {
      logger.info(
        `[${mode.toUpperCase()}] Server listening on ${host}:${port}`
      );
    });

    if (mode === 'silo') {
      // start kafka consumer for emergency requests
      startEmergencyRequestService().catch(e =>
        logger.error('Worker startup failed:', e)
      );

      // start background workers (outbox publisher, timeout handler, etc.)
      startAllWorkers();

      registerSmsWebhook().catch(err => {
        // TODO: migrate console logs to logger
        logger.error(
          '[WEBHOOK]: error while registering',
          err.message || err.response.message
        );
      });
    }

    if (mode === 'platform') {
      // consume silo→platform incident status updates via Kafka
      startIncidentUpdateWorker().catch(e =>
        logger.error('Worker startup failed:', e)
      );
    }

    // TODO: this was old polling remove it
    // start sms polling worker for offline emergency requests
    // startSMSPollingWorker().catch(e => logger.error('Worker startup failed:', e));
  } catch (error) {
    logger.info('Error starting server', error);
  }
}

startServer();
