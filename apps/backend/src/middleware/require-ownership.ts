import type { Request, Response, NextFunction } from 'express';

import type { AppError } from './error-handler.js';

type ResourceFetcher = (id: string) => Promise<{ authorId: string } | null>;

const requireOwnership = (fetchResource: ResourceFetcher, paramName = 'id') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const resourceId = req.params[paramName];
    if (!resourceId) {
      const error = new Error('Resource ID is required') as AppError;
      error.statusCode = 400;
      error.code = 'BAD_REQUEST';
      return next(error);
    }

    const resource = await fetchResource(resourceId);
    if (!resource) {
      const error = new Error('Resource not found') as AppError;
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      return next(error);
    }

    if (resource.authorId !== req.user?.userId) {
      const error = new Error('You do not have permission to modify this resource') as AppError;
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      return next(error);
    }

    next();
  };
};

export { requireOwnership };
export type { ResourceFetcher };
