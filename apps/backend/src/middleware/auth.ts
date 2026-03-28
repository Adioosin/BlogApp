import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import type { TokenPayload } from '@blogapp/types';

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      error: { message: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' },
    });
    return;
  }

  const token = header.slice(7);
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET environment variable is required');
  }

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

export { authenticate };
