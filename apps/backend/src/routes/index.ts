import { Router } from 'express';

import { authRouter } from './auth.js';
import { commentsRouter } from './comments.js';
import { healthRouter } from './health.js';
import { postsRouter } from './posts.js';

const v1Router = Router();

v1Router.use(healthRouter);
v1Router.use(authRouter);
v1Router.use(postsRouter);
v1Router.use(commentsRouter);

export { v1Router };
