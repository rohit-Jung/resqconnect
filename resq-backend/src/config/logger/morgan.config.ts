import morgan from 'morgan';

import { logger } from './winston.config.js';

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

const morganConfig = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);

export { morganConfig };
