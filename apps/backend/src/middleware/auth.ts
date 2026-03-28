import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import type { TokenPayload } from '@blogapp/types';

import { env } from '../lib/env.js';

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      error: { message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' },
    });
    return;
  }

  const token = header.slice(7);
  const secret = env('JWT_ACCESS_SECRET');

  try {
    const payload = jwt.verify(token, secret) as TokenPayload;
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch {
    res.status(401).json({
      error: { message: 'Invalid or expired access token', code: 'UNAUTHORIZED' },
    });
  }
};

const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }

  const token = header.slice(7);
  const secret = env('JWT_ACCESS_SECRET');

  try {
    const payload = jwt.verify(token, secret) as TokenPayload;
    req.user = { userId: payload.userId, email: payload.email };
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
};

export { authenticate, optionalAuth };
