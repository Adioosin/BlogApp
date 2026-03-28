import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';

import { validate } from '../../middleware/validate.js';

function createApp(schema: z.ZodSchema, target: 'body' | 'query' | 'params' = 'body') {
  const app = express();
  app.use(express.json());

  if (target === 'params') {
    app.post('/test/:id', validate(schema, target), (_req, res) => {
      res.json({ data: { ok: true } });
    });
  } else {
    app.post('/test', validate(schema, target), (req, res) => {
      res.json({ data: req[target] });
    });
  }

  return app;
}

const bodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

describe('validate middleware', () => {
  describe('body validation', () => {
    it('passes valid body through to handler', async () => {
      const app = createApp(bodySchema);

      const res = await request(app)
        .post('/test')
        .send({ name: 'Alice', email: 'alice@example.com' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        data: { name: 'Alice', email: 'alice@example.com' },
      });
    });

    it('returns 422 for missing required fields', async () => {
      const app = createApp(bodySchema);

      const res = await request(app).post('/test').send({});

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('name');
      expect(res.body.error.message).toContain('email');
    });

    it('returns 422 for invalid email format', async () => {
      const app = createApp(bodySchema);

      const res = await request(app)
        .post('/test')
        .send({ name: 'Alice', email: 'not-an-email' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toContain('email');
    });

    it('strips unknown fields from body', async () => {
      const schema = z.object({ name: z.string() });
      const app = createApp(schema);

      const res = await request(app)
        .post('/test')
        .send({ name: 'Alice', extra: 'field' });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ name: 'Alice' });
      expect(res.body.data).not.toHaveProperty('extra');
    });
  });

  describe('query validation', () => {
    it('validates query parameters', async () => {
      const querySchema = z.object({
        page: z.string().regex(/^\d+$/),
      });
      const app = createApp(querySchema, 'query');

      const res = await request(app).post('/test?page=1');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ page: '1' });
    });

    it('returns 422 for invalid query params', async () => {
      const querySchema = z.object({
        page: z.string().regex(/^\d+$/),
      });
      const app = createApp(querySchema, 'query');

      const res = await request(app).post('/test?page=abc');

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('response shape', () => {
    it('follows { error: { message, code } } convention', async () => {
      const app = createApp(bodySchema);

      const res = await request(app).post('/test').send({});

      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('message');
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.headers['content-type']).toMatch(/application\/json/);
    });
  });
});
