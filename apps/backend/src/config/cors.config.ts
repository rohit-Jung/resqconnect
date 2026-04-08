import { envConfig } from './env.config';

export const allowedOrigins = envConfig.allowed_origins;

export const corsOptions = {
  origin: function (origin: any, callback: any) {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost')) return callback(null, true);

    if (origin.includes('//')) origin = origin.split('//')[1];
    if (origin.includes(':')) origin = origin.split(':')[0];

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg =
        'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    } else {
      return callback(null, true);
    }
  },
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
};
