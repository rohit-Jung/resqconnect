import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';

import { corsOptions } from '@/config';
import { v1Router } from '@/routes';

const app = express();

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use();
app.use('/api/v1', v1Router);

export { app };
