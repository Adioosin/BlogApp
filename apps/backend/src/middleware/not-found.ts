import type { Request, Response, NextFunction } from 'express';

const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new Error(`Not found: ${req.originalUrl}`) as Error & {
    statusCode: number;
    code: string;
  };
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  next(error);
};

export { notFound };
