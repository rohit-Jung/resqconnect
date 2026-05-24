import winston from 'winston';

import { envConfig } from '../env.config';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  verbose: 5,
};

const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
  verbose: 'cyan',
};

const isDevelopment = envConfig.node_env === 'development';

const plainFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(
    ({ timestamp, level, message }) =>
      `${timestamp} [${level.toUpperCase()}] ${message}`
  )
);

const colorFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ level, message }) => `${level} ${message}`)
);

const transports = [
  new winston.transports.Console({
    level: isDevelopment ? 'debug' : 'error',
    format: isDevelopment ? colorFormat : plainFormat,
  }),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: plainFormat,
  }),
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: plainFormat,
  }),
  new winston.transports.File({
    filename: 'logs/info.log',
    level: 'info',
    format: plainFormat,
  }),
  new winston.transports.File({
    filename: 'logs/debug.log',
    level: 'debug',
    format: plainFormat,
  }),
];

const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(
    ({ timestamp, level, message }) =>
      `${timestamp} [${level.toUpperCase()}] ${message}`
  )
);

winston.addColors(colors);

const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

export { logger };
