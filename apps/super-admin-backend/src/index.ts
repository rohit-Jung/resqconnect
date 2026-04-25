import { createServer } from 'node:http';

import 'dotenv/config';

import { envConfig } from '@/config';

import { app } from './app';
import { ensureSeedAdmin } from './services/admin-seed.service';
import { startSiloPollWorker } from './workers/silo-poll.worker';

const port = envConfig.port;

async function startServer() {
  await ensureSeedAdmin();
  const httpServer = createServer(app);

  httpServer.listen(port, envConfig.dev_ip, () => {
    console.log(
      `Super-admin backend listening on: ${envConfig.dev_ip}:${port}`
    );
  });

  startSiloPollWorker();
}

startServer().catch(err => {
  console.error('Failed to start server', err);
  process.exitCode = 1;
});
