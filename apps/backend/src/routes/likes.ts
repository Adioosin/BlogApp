import { Router, type Router as RouterType } from 'express';

import { authenticate } from '../middleware/auth.js';
import * as likeService from '../services/like-service.js';

const likesRouter: RouterType = Router();

likesRouter.post('/posts/:id/like', authenticate, async (req, res, next) => {
  try {
    await likeService.likePost(req.params.id, req.user!.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

likesRouter.delete('/posts/:id/like', authenticate, async (req, res, next) => {
  try {
    await likeService.unlikePost(req.params.id, req.user!.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export { likesRouter };
