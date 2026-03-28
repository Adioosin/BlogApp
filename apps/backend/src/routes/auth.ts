import { Router, type Router as RouterType } from 'express';
import { z } from 'zod';

import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rate-limit.js';
import { prisma } from '../lib/prisma.js';
import * as authService from '../services/auth-service.js';

const authRouter: RouterType = Router();

// Zod schemas

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// Routes

authRouter.post('/auth/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({ data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/auth/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/auth/refresh', authLimiter, validate(refreshSchema), async (req, res, next) => {
  try {
    const tokens = await authService.refreshTokens(req.body.refreshToken);
    res.json({ data: tokens });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/auth/logout', authenticate, validate(refreshSchema), async (req, res, next) => {
  try {
    await authService.logoutUser(req.body.refreshToken);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

authRouter.get('/auth/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      res.status(401).json({
        error: { message: 'User not found', code: 'UNAUTHORIZED' },
      });
      return;
    }

    res.json({ data: user });
  } catch (err) {
    next(err);
  }
});

export { authRouter };
