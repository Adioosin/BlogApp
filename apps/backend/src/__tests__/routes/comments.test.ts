import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import { app } from '../../app.js';

// Mock prisma
vi.mock('../../lib/prisma.js', () => {
  return {
    prisma: {
      post: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      comment: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        count: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      refreshToken: {
        create: vi.fn(),
      },
    },
  };
});

const { prisma } = await import('../../lib/prisma.js');
const mockedPrisma = vi.mocked(prisma);

const TEST_ACCESS_SECRET = 'test-access-secret';

const author = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'author@example.com',
  name: 'Author',
};

const otherUser = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'other@example.com',
  name: 'Other User',
};

const publishedPost = {
  id: '10000000-0000-0000-0000-000000000001',
  isPublished: true,
};

const draftPost = {
  id: '10000000-0000-0000-0000-000000000002',
  isPublished: false,
};

const comment = {
  id: '20000000-0000-0000-0000-000000000001',
  body: 'Great post!',
  postId: publishedPost.id,
  authorId: author.id,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  author,
};

function makeToken(userId: string, email: string) {
  return jwt.sign({ userId, email }, TEST_ACCESS_SECRET, { expiresIn: '15m' });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_ACCESS_SECRET = TEST_ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
});

// ─── POST /api/v1/posts/:id/comments ────────────────────────────────────

describe('POST /api/v1/posts/:id/comments', () => {
  it('creates a comment on a published post', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(publishedPost as never);
    mockedPrisma.comment.create.mockResolvedValue(comment as never);

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .post(`/api/v1/posts/${publishedPost.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Great post!' });

    expect(res.status).toBe(201);
    expect(res.body.data.body).toBe('Great post!');
    expect(res.body.data.authorId).toBe(author.id);
    expect(res.body.data.postId).toBe(publishedPost.id);
    expect(res.body.data.author).toEqual(author);
  });

  it('returns 404 when commenting on a draft', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(draftPost as never);

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .post(`/api/v1/posts/${draftPost.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Comment on draft' });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Post not found');
  });

  it('returns 404 when post does not exist', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(null);

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .post('/api/v1/posts/nonexistent-id/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Comment on nothing' });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Post not found');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post(`/api/v1/posts/${publishedPost.id}/comments`)
      .send({ body: 'No auth' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 422 with empty body', async () => {
    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .post(`/api/v1/posts/${publishedPost.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: '' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 with missing body field', async () => {
    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .post(`/api/v1/posts/${publishedPost.id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── GET /api/v1/posts/:id/comments ─────────────────────────────────────

describe('GET /api/v1/posts/:id/comments', () => {
  it('returns paginated comments for a published post', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(publishedPost as never);
    mockedPrisma.comment.findMany.mockResolvedValue([comment] as never);
    mockedPrisma.comment.count.mockResolvedValue(1);

    const res = await request(app).get(`/api/v1/posts/${publishedPost.id}/comments`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].body).toBe('Great post!');
    expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 1 });
  });

  it('respects page and limit query params', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(publishedPost as never);
    mockedPrisma.comment.findMany.mockResolvedValue([]);
    mockedPrisma.comment.count.mockResolvedValue(25);

    const res = await request(app).get(`/api/v1/posts/${publishedPost.id}/comments?page=2&limit=10`);

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 2, limit: 10, total: 25 });
  });

  it('returns 404 for comments on a draft', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(draftPost as never);

    const res = await request(app).get(`/api/v1/posts/${draftPost.id}/comments`);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Post not found');
  });

  it('returns 404 for comments on a non-existent post', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/v1/posts/nonexistent-id/comments');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Post not found');
  });

  it('does not require authentication', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(publishedPost as never);
    mockedPrisma.comment.findMany.mockResolvedValue([]);
    mockedPrisma.comment.count.mockResolvedValue(0);

    const res = await request(app).get(`/api/v1/posts/${publishedPost.id}/comments`);

    expect(res.status).toBe(200);
  });
});

// ─── DELETE /api/v1/comments/:id ─────────────────────────────────────────

describe('DELETE /api/v1/comments/:id', () => {
  it('deletes a comment as the author', async () => {
    mockedPrisma.comment.findUnique.mockResolvedValue({ authorId: author.id } as never);
    mockedPrisma.comment.delete.mockResolvedValue(comment as never);

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .delete(`/api/v1/comments/${comment.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
    expect(mockedPrisma.comment.delete).toHaveBeenCalledWith({ where: { id: comment.id } });
  });

  it('returns 403 when non-author tries to delete', async () => {
    mockedPrisma.comment.findUnique.mockResolvedValue({ authorId: author.id } as never);

    const token = makeToken(otherUser.id, otherUser.email);
    const res = await request(app)
      .delete(`/api/v1/comments/${comment.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 when comment does not exist', async () => {
    mockedPrisma.comment.findUnique.mockResolvedValue(null);

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .delete('/api/v1/comments/nonexistent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).delete(`/api/v1/comments/${comment.id}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
