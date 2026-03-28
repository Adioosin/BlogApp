import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import { requireOwnership } from '../../middleware/require-ownership.js';

function createMockReqRes(userId: string, paramId = 'resource-1') {
  const req = {
    user: { userId, email: 'test@example.com' },
    params: { id: paramId },
  } as unknown as Request;

  const res = {} as Response;

  const next = vi.fn() as NextFunction;

  return { req, res, next };
}

describe('requireOwnership middleware', () => {
  it('calls next when user is the resource owner', async () => {
    const fetcher = vi.fn().mockResolvedValue({ authorId: 'user-1' });
    const middleware = requireOwnership(fetcher);
    const { req, res, next } = createMockReqRes('user-1');

    await middleware(req, res, next);

    expect(fetcher).toHaveBeenCalledWith('resource-1');
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 403 when user is not the owner', async () => {
    const fetcher = vi.fn().mockResolvedValue({ authorId: 'other-user' });
    const middleware = requireOwnership(fetcher);
    const { req, res, next } = createMockReqRes('user-1');

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 403,
        code: 'FORBIDDEN',
      }),
    );
  });

  it('returns 404 when resource is not found', async () => {
    const fetcher = vi.fn().mockResolvedValue(null);
    const middleware = requireOwnership(fetcher);
    const { req, res, next } = createMockReqRes('user-1');

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        code: 'NOT_FOUND',
      }),
    );
  });

  it('uses custom param name when provided', async () => {
    const fetcher = vi.fn().mockResolvedValue({ authorId: 'user-1' });
    const middleware = requireOwnership(fetcher, 'postId');
    const req = {
      user: { userId: 'user-1', email: 'test@example.com' },
      params: { postId: 'post-123' },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    await middleware(req, res, next);

    expect(fetcher).toHaveBeenCalledWith('post-123');
    expect(next).toHaveBeenCalledWith();
  });

  it('returns 400 when resource ID param is missing', async () => {
    const fetcher = vi.fn();
    const middleware = requireOwnership(fetcher);
    const req = {
      user: { userId: 'user-1', email: 'test@example.com' },
      params: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    await middleware(req, res, next);

    expect(fetcher).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        code: 'BAD_REQUEST',
      }),
    );
  });
});
