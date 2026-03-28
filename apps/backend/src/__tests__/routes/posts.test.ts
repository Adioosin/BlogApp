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
  title: 'Published Post',
  content: 'Published content',
  isPublished: true,
  authorId: author.id,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  author,
};

const draftPost = {
  id: '10000000-0000-0000-0000-000000000002',
  title: 'Draft Post',
  content: 'Draft content',
  isPublished: false,
  authorId: author.id,
  createdAt: new Date('2026-01-02'),
  updatedAt: new Date('2026-01-02'),
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

// ─── GET /api/v1/posts ──────────────────────────────────────────────────

describe('GET /api/v1/posts', () => {
  it('returns paginated published posts', async () => {
    mockedPrisma.post.findMany.mockResolvedValue([publishedPost]);
    mockedPrisma.post.count.mockResolvedValue(1);

    const res = await request(app).get('/api/v1/posts');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Published Post');
    expect(res.body.data[0].isPublished).toBe(true);
    expect(res.body.meta).toEqual({ page: 1, limit: 10, total: 1 });
  });

  it('respects page and limit query params', async () => {
    mockedPrisma.post.findMany.mockResolvedValue([]);
    mockedPrisma.post.count.mockResolvedValue(20);

    const res = await request(app).get('/api/v1/posts?page=2&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 2, limit: 5, total: 20 });
    expect(mockedPrisma.post.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 5, take: 5 }),
    );
  });

  it('returns 422 for invalid page param', async () => {
    const res = await request(app).get('/api/v1/posts?page=-1');

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 for limit exceeding max', async () => {
    const res = await request(app).get('/api/v1/posts?limit=200');

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns author info in each post', async () => {
    mockedPrisma.post.findMany.mockResolvedValue([publishedPost]);
    mockedPrisma.post.count.mockResolvedValue(1);

    const res = await request(app).get('/api/v1/posts');

    expect(res.body.data[0].author).toEqual({
      id: author.id,
      email: author.email,
      name: author.name,
    });
  });
});

// ─── GET /api/v1/posts/me ───────────────────────────────────────────────

describe('GET /api/v1/posts/me', () => {
  it('returns all posts including drafts for the authenticated user', async () => {
    mockedPrisma.post.findMany.mockResolvedValue([publishedPost, draftPost]);
    mockedPrisma.post.count.mockResolvedValue(2);

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .get('/api/v1/posts/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).get('/api/v1/posts/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

// ─── GET /api/v1/posts/:id ──────────────────────────────────────────────

describe('GET /api/v1/posts/:id', () => {
  it('returns a published post to anonymous users', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(publishedPost);

    const res = await request(app).get(`/api/v1/posts/${publishedPost.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(publishedPost.id);
    expect(res.body.data.title).toBe('Published Post');
  });

  it('returns a draft to its author', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(draftPost);

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .get(`/api/v1/posts/${draftPost.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(draftPost.id);
    expect(res.body.data.isPublished).toBe(false);
  });

  it('returns 404 for a draft when requested by another user', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(draftPost);

    const token = makeToken(otherUser.id, otherUser.email);
    const res = await request(app)
      .get(`/api/v1/posts/${draftPost.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for a draft when requested anonymously', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(draftPost);

    const res = await request(app).get(`/api/v1/posts/${draftPost.id}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for non-existent post', async () => {
    mockedPrisma.post.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/v1/posts/non-existent-id');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ─── POST /api/v1/posts ─────────────────────────────────────────────────

describe('POST /api/v1/posts', () => {
  it('creates a draft post and returns 201', async () => {
    const newPost = {
      ...draftPost,
      title: 'New Draft',
      content: 'New content',
    };
    mockedPrisma.post.create.mockResolvedValue(newPost);

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Draft', content: 'New content' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('New Draft');
    expect(res.body.data.isPublished).toBe(false);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .post('/api/v1/posts')
      .send({ title: 'Test', content: 'Test' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 422 for missing title', async () => {
    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'No title' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 for missing content', async () => {
    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'No content' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 for empty title', async () => {
    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '', content: 'Some content' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── PATCH /api/v1/posts/:id ────────────────────────────────────────────

describe('PATCH /api/v1/posts/:id', () => {
  it('updates a post and returns updated data', async () => {
    // requireOwnership calls findPostById
    mockedPrisma.post.findUnique.mockResolvedValueOnce({ authorId: author.id } as never);
    mockedPrisma.post.update.mockResolvedValue({
      ...publishedPost,
      title: 'Updated Title',
    });

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .patch(`/api/v1/posts/${publishedPost.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app)
      .patch(`/api/v1/posts/${publishedPost.id}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(401);
  });

  it('returns 403 when non-owner tries to update', async () => {
    mockedPrisma.post.findUnique.mockResolvedValueOnce({ authorId: author.id } as never);

    const token = makeToken(otherUser.id, otherUser.email);
    const res = await request(app)
      .patch(`/api/v1/posts/${publishedPost.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hacked' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 when post does not exist', async () => {
    mockedPrisma.post.findUnique.mockResolvedValueOnce(null);

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .patch('/api/v1/posts/non-existent-id')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 422 for invalid update data', async () => {
    mockedPrisma.post.findUnique.mockResolvedValueOnce({ authorId: author.id } as never);

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .patch(`/api/v1/posts/${publishedPost.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─── PATCH /api/v1/posts/:id/publish ────────────────────────────────────

describe('PATCH /api/v1/posts/:id/publish', () => {
  it('publishes a draft and returns the published post', async () => {
    mockedPrisma.post.findUnique.mockResolvedValueOnce({ authorId: author.id } as never);
    mockedPrisma.post.update.mockResolvedValue({
      ...draftPost,
      isPublished: true,
    });

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .patch(`/api/v1/posts/${draftPost.id}/publish`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.isPublished).toBe(true);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).patch(`/api/v1/posts/${draftPost.id}/publish`);

    expect(res.status).toBe(401);
  });

  it('returns 403 when non-owner tries to publish', async () => {
    mockedPrisma.post.findUnique.mockResolvedValueOnce({ authorId: author.id } as never);

    const token = makeToken(otherUser.id, otherUser.email);
    const res = await request(app)
      .patch(`/api/v1/posts/${draftPost.id}/publish`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 when post does not exist', async () => {
    mockedPrisma.post.findUnique.mockResolvedValueOnce(null);

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .patch('/api/v1/posts/non-existent-id/publish')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});

// ─── DELETE /api/v1/posts/:id ───────────────────────────────────────────

describe('DELETE /api/v1/posts/:id', () => {
  it('deletes the post and returns 204', async () => {
    mockedPrisma.post.findUnique.mockResolvedValueOnce({ authorId: author.id } as never);
    mockedPrisma.post.delete.mockResolvedValue({} as never);

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .delete(`/api/v1/posts/${publishedPost.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it('returns 401 without auth token', async () => {
    const res = await request(app).delete(`/api/v1/posts/${publishedPost.id}`);

    expect(res.status).toBe(401);
  });

  it('returns 403 when non-owner tries to delete', async () => {
    mockedPrisma.post.findUnique.mockResolvedValueOnce({ authorId: author.id } as never);

    const token = makeToken(otherUser.id, otherUser.email);
    const res = await request(app)
      .delete(`/api/v1/posts/${publishedPost.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 when post does not exist', async () => {
    mockedPrisma.post.findUnique.mockResolvedValueOnce(null);

    const token = makeToken(author.id, author.email);
    const res = await request(app)
      .delete('/api/v1/posts/non-existent-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
