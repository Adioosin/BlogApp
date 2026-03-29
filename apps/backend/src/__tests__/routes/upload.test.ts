import fs from 'node:fs';
import path from 'node:path';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

import { app } from '../../app.js';

// Mock prisma (required because app.ts imports routes that import prisma)
vi.mock('../../lib/prisma.js', () => {
  return {
    prisma: {
      post: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
      user: { findUnique: vi.fn() },
      refreshToken: { create: vi.fn() },
    },
  };
});

const TEST_ACCESS_SECRET = 'test-access-secret';

const testUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'user@example.com',
  name: 'Test User',
};

function makeToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, TEST_ACCESS_SECRET);
}

const UPLOADS_DIR = path.resolve('uploads');

describe('Upload routes', () => {
  beforeEach(() => {
    vi.stubEnv('JWT_ACCESS_SECRET', TEST_ACCESS_SECRET);
    vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret');
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    // Clean up any test uploads
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(UPLOADS_DIR, file));
      }
      fs.rmdirSync(UPLOADS_DIR);
    }
  });

  describe('POST /api/v1/upload/image', () => {
    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/v1/upload/image')
        .attach('image', Buffer.from('fake'), { filename: 'test.png', contentType: 'image/png' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 400 when no file is provided', async () => {
      const token = makeToken(testUser.id, testUser.email);

      const res = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_FILE');
    });

    it('returns 422 for invalid file type', async () => {
      const token = makeToken(testUser.id, testUser.email);

      const res = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', Buffer.from('not an image'), { filename: 'test.txt', contentType: 'text/plain' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('INVALID_FILE');
    });

    it('uploads image and returns url', async () => {
      const token = makeToken(testUser.id, testUser.email);

      // Create a 1x1 transparent PNG
      const pngBuffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64',
      );

      const res = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', pngBuffer, { filename: 'test.png', contentType: 'image/png' });

      expect(res.status).toBe(201);
      expect(res.body.data.url).toMatch(/^\/uploads\/.+\.png$/);
      expect(res.body.data.filename).toMatch(/\.png$/);

      // Verify file was actually saved
      const filePath = path.join(UPLOADS_DIR, res.body.data.filename);
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('accepts jpeg images', async () => {
      const token = makeToken(testUser.id, testUser.email);

      const res = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', Buffer.from('jpeg-data'), { filename: 'photo.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
      expect(res.body.data.url).toMatch(/^\/uploads\/.+\.jpg$/);
    });

    it('accepts webp images', async () => {
      const token = makeToken(testUser.id, testUser.email);

      const res = await request(app)
        .post('/api/v1/upload/image')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', Buffer.from('webp-data'), { filename: 'photo.webp', contentType: 'image/webp' });

      expect(res.status).toBe(201);
      expect(res.body.data.url).toMatch(/^\/uploads\/.+\.webp$/);
    });
  });
});
