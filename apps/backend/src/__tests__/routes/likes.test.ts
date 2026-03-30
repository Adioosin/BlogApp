import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import { app } from '../../app.js';

vi.mock('../../lib/prisma.js', () => {
  return {
    prisma: {
      post: {
        findUnique: vi.fn(),
      },
      postLike: {
        upsert: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
  };
});

const { prisma } = await import('../../lib/prisma.js');
const mockedPrisma = vi.mocked(prisma);

const TEST_ACCESS_SECRET = 'test-access-secret';

const publishedPost = {
  id: '10000000-0000-0000-0000-000000000001',
  isPublished: true,
};

function makeToken(userId: string, email: string) {
  return jwt.sign({ userId, email }, TEST_ACCESS_SECRET, { expiresIn: '15m' });
}

const token = makeToken('00000000-0000-0000-0000-000000000001', 'user@example.com');

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_ACCESS_SECRET = TEST_ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
});

// ─── POST /api/v1/posts/:id/like ────────────────────────────────────────────

describe('POST /api/v1/posts/:id/like', () => {
  it('likes a published post for an authenticated user', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(publishedPost);
    mockedPrisma.postLike.upsert.mockResolvedValue({} as never);

    const res = await request(app)
      .post(`/api/v1/posts/${publishedPost.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(mockedPrisma.postLike.upsert).toHaveBeenCalledOnce();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app).post(`/api/v1/posts/${publishedPost.id}/like`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 404 when the post does not exist', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/v1/posts/${publishedPost.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 when the post is unpublished', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue({ ...publishedPost, isPublished: false });

    const res = await request(app)
      .post(`/api/v1/posts/${publishedPost.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ─── DELETE /api/v1/posts/:id/like ──────────────────────────────────────────

describe('DELETE /api/v1/posts/:id/like', () => {
  it('unlikes a published post for an authenticated user', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(publishedPost);
    mockedPrisma.postLike.deleteMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .delete(`/api/v1/posts/${publishedPost.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(mockedPrisma.postLike.deleteMany).toHaveBeenCalledOnce();
  });

  it('returns 401 without an auth token', async () => {
    const res = await request(app).delete(`/api/v1/posts/${publishedPost.id}/like`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 404 when the post does not exist', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete(`/api/v1/posts/${publishedPost.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 when the post is unpublished', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue({ ...publishedPost, isPublished: false });

    const res = await request(app)
      .delete(`/api/v1/posts/${publishedPost.id}/like`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
