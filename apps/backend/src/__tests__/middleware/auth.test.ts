import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import { authenticate } from '../../middleware/auth.js';

const TEST_SECRET = 'test-access-secret';

function createMockReqRes(authHeader?: string) {
  const req = {
    headers: {
      authorization: authHeader,
    },
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const next = vi.fn() as NextFunction;

  return { req, res, next };
}

beforeEach(() => {
  process.env.JWT_ACCESS_SECRET = TEST_SECRET;
});

describe('authenticate middleware', () => {
  it('calls next and attaches user on valid token', () => {
    const payload = { userId: 'user-1', email: 'test@example.com' };
    const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '15m' });
    const { req, res, next } = createMockReqRes(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: 'user-1', email: 'test@example.com' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header is missing', () => {
    const { req, res, next } = createMockReqRes(undefined);

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: expect.stringContaining('authorization'), code: 'UNAUTHORIZED' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header does not start with Bearer', () => {
    const { req, res, next } = createMockReqRes('Basic abc123');

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for expired token', () => {
    const payload = { userId: 'user-1', email: 'test@example.com' };
    const token = jwt.sign(payload, TEST_SECRET, { expiresIn: '-1s' });
    const { req, res, next } = createMockReqRes(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: expect.stringContaining('expired'), code: 'UNAUTHORIZED' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for token signed with wrong secret', () => {
    const payload = { userId: 'user-1', email: 'test@example.com' };
    const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '15m' });
    const { req, res, next } = createMockReqRes(`Bearer ${token}`);

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for malformed token', () => {
    const { req, res, next } = createMockReqRes('Bearer not.a.valid.jwt');

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
