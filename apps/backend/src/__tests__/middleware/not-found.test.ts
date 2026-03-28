import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { app } from '../../app.js';

describe('not-found middleware', () => {
  it('returns 404 for unknown GET routes', async () => {
    const res = await request(app).get('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toContain('/does-not-exist');
  });

  it('returns 404 for unknown POST routes', async () => {
    const res = await request(app).post('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for unknown PUT routes', async () => {
    const res = await request(app).put('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for unknown DELETE routes', async () => {
    const res = await request(app).delete('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns 404 for unknown nested api routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent');

    expect(res.status).toBe(404);
    expect(res.body.error.message).toContain('/api/v1/nonexistent');
  });

  it('returns standard error response shape', async () => {
    const res = await request(app).get('/xyz');

    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toHaveProperty('message');
    expect(res.body.error).toHaveProperty('code');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });
});
