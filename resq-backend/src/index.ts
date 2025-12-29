import { createServer } from 'node:http';

import 'dotenv/config';

import { envConfig } from '@/config';
import { app } from './app';

const port = envConfig.port;

function startServer() {
  try {
    const httpServer = createServer(app);

    httpServer.listen(port, () => {
      console.log(`Server is listening on: ${port}`);
    });
  } catch (error) {
    console.log('Error starting server', error);
  }
}

startServer();
