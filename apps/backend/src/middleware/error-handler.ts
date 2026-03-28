import type { Request, Response, NextFunction } from 'express';

type AppError = Error & {
  statusCode?: number;
  code?: string;
};

const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err.statusCode ?? 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;
  const code = err.code;

  if (statusCode === 500) {
    console.error('Unhandled error:', err);
  }

  res.status(statusCode).json({
    error: { message, ...(code && { code }) },
  });
};

export { errorHandler };
export type { AppError };
