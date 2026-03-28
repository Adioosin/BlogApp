import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';

import { validate } from '../middleware/validate.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireOwnership } from '../middleware/require-ownership.js';
import * as postService from '../services/post-service.js';

const postsRouter: RouterType = Router();

// Zod schemas

const createPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
});

const updatePostSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'title']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

const myPostsPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Routes

postsRouter.get('/posts', validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit, sortBy, order } = req.query as unknown as {
      page: number;
      limit: number;
      sortBy: string;
      order: string;
    };
    const result = await postService.listPublishedPosts(page, limit, sortBy, order);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

postsRouter.get('/posts/me', authenticate, validate(myPostsPaginationSchema, 'query'), async (req, res, next) => {
  try {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const result = await postService.listMyPosts(req.user!.userId, page, limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

postsRouter.get('/posts/:id', optionalAuth, async (req, res, next) => {
  try {
    const post = await postService.getPost(req.params.id, req.user?.userId);
    res.json({ data: post });
  } catch (err) {
    next(err);
  }
});

postsRouter.post('/posts', authenticate, validate(createPostSchema), async (req, res, next) => {
  try {
    const post = await postService.createPost(req.body, req.user!.userId);
    res.status(201).json({ data: post });
  } catch (err) {
    next(err);
  }
});

postsRouter.patch(
  '/posts/:id',
  authenticate,
  requireOwnership(postService.findPostById),
  validate(updatePostSchema),
  async (req, res, next) => {
    try {
      const post = await postService.updatePost(req.params.id, req.body);
      res.json({ data: post });
    } catch (err) {
      next(err);
    }
  },
);

postsRouter.patch(
  '/posts/:id/publish',
  authenticate,
  requireOwnership(postService.findPostById),
  async (req, res, next) => {
    try {
      const post = await postService.publishPost(req.params.id);
      res.json({ data: post });
    } catch (err) {
      next(err);
    }
  },
);

postsRouter.delete(
  '/posts/:id',
  authenticate,
  requireOwnership(postService.findPostById),
  async (req, res, next) => {
    try {
      await postService.deletePost(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export { postsRouter };
