import { describe, it, expect } from 'vitest';
import request from 'supertest';

import { app } from '../app.js';

describe('backend smoke tests', () => {
  it('GET / returns BlogApp API message', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { message: 'BlogApp API' } });
  });

  it('returns JSON content type', async () => {
    const res = await request(app).get('/');

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown');

    expect(res.status).toBe(404);
  });
});
