import path from 'node:path';

import express from 'express';
import cors from 'cors';

import { v1Router } from './routes/index.js';
import { notFound } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static(path.resolve('uploads')));

app.get('/', (_req, res) => {
  res.json({ data: { message: 'BlogApp API' } });
});

app.use('/api/v1', v1Router);

app.use(notFound);
app.use(errorHandler);

export { app };
