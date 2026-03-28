import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

import { errorHandler } from '../../middleware/error-handler.js';
import type { AppError } from '../../middleware/error-handler.js';

function createApp(error: AppError) {
  const app = express();
  app.get('/error', (_req, _res, next) => next(error));
  app.use(errorHandler);
  return app;
}

describe('errorHandler middleware', () => {
  it('returns custom statusCode and message when set', async () => {
    const err = new Error('Resource not found') as AppError;
    err.statusCode = 404;
    err.code = 'NOT_FOUND';

    const res = await request(createApp(err)).get('/error');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      error: { message: 'Resource not found', code: 'NOT_FOUND' },
    });
  });

  it('defaults to 500 and hides original message', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('secret db details') as AppError;

    const res = await request(createApp(err)).get('/error');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { message: 'Internal server error' },
    });
    expect(res.body.error.message).not.toContain('secret');
    consoleSpy.mockRestore();
  });

  it('logs unhandled 500 errors to console', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('unexpected failure') as AppError;

    await request(createApp(err)).get('/error');

    expect(consoleSpy).toHaveBeenCalledWith('Unhandled error:', err);
    consoleSpy.mockRestore();
  });

  it('does not log non-500 errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new Error('bad request') as AppError;
    err.statusCode = 400;

    await request(createApp(err)).get('/error');

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('omits code field when not set on error', async () => {
    const err = new Error('forbidden') as AppError;
    err.statusCode = 403;

    const res = await request(createApp(err)).get('/error');

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      error: { message: 'forbidden' },
    });
    expect(res.body.error).not.toHaveProperty('code');
  });

  it('returns JSON content type', async () => {
    const err = new Error('test') as AppError;
    err.statusCode = 422;

    const res = await request(createApp(err)).get('/error');

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
