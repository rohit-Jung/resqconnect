import { createServer } from 'node:http';

import 'dotenv/config';

import { envConfig } from '@/config';
import '@/services/kafka/kafka.service';

import { app } from './app';
import { initializeSocketServer } from './socket';
import { startAllWorkers } from './workers/background.worker';
import { startSMSPollingWorker } from './workers/messaging.worker';
import { startEmergencyRequestService } from './workers/request.worker';

const port = envConfig.port;

function startServer() {
  try {
    const httpServer = createServer(app);
    initializeSocketServer(httpServer);

    httpServer.listen(port, envConfig.dev_ip, () => {
      console.log(`Server is listening on: ${port}`);
    });

    // Start Kafka consumer for emergency requests
    startEmergencyRequestService().catch(console.log);

    // Start background workers (outbox publisher, timeout handler, etc.)
    startAllWorkers();

    // Start SMS polling worker for offline emergency requests
    startSMSPollingWorker().catch(console.log);
  } catch (error) {
    console.log('Error starting server', error);
  }
}

startServer();
