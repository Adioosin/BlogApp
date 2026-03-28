import { Router } from 'express';

import { authRouter } from './auth.js';
import { healthRouter } from './health.js';

const v1Router = Router();

v1Router.use(healthRouter);
v1Router.use(authRouter);

export { v1Router };
