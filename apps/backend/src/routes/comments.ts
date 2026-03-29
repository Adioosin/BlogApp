import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';

import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireOwnership } from '../middleware/require-ownership.js';
import { commentLimiter } from '../middleware/rate-limit.js';
import * as commentService from '../services/comment-service.js';

const commentsRouter: RouterType = Router();

// Zod schemas

const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});

const commentsPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Routes

commentsRouter.post(
  '/posts/:id/comments',
  authenticate,
  commentLimiter,
  validate(createCommentSchema),
  async (req, res, next) => {
    try {
      const comment = await commentService.createComment(req.params.id, req.body, req.user!.userId);
      res.status(201).json({ data: comment });
    } catch (err) {
      next(err);
    }
  },
);

commentsRouter.get(
  '/posts/:id/comments',
  validate(commentsPaginationSchema, 'query'),
  async (req, res, next) => {
    try {
      const { page, limit } = req.query as unknown as { page: number; limit: number };
      const result = await commentService.listComments(req.params.id, page, limit);
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

commentsRouter.delete(
  '/comments/:id',
  authenticate,
  requireOwnership(commentService.findCommentById),
  async (req, res, next) => {
    try {
      await commentService.deleteComment(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export { commentsRouter };
