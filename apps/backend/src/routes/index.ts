import { Router } from 'express';

import { healthRouter } from './health.js';

const v1Router = Router();

v1Router.use(healthRouter);

export { v1Router };
