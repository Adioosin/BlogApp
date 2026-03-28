import { createHash } from 'node:crypto';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { app } from '../../app.js';

// Mock prisma
vi.mock('../../lib/prisma.js', () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      refreshToken: {
        create: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
  };
});

// Import after mock
const { prisma } = await import('../../lib/prisma.js');
const mockedPrisma = vi.mocked(prisma);

const TEST_ACCESS_SECRET = 'test-access-secret';
const TEST_REFRESH_SECRET = 'test-refresh-secret';

beforeEach(() => {
  vi.clearAllMocks();
  process.env.JWT_ACCESS_SECRET = TEST_ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = TEST_REFRESH_SECRET;
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
});

const validUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  name: 'Test User',
  password: '', // will be set in tests
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('POST /api/v1/auth/register', () => {
  it('returns 201 with user and tokens on success', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      ...validUser,
      password: await bcrypt.hash('securepassword', 10),
    });
    mockedPrisma.refreshToken.create.mockResolvedValue({} as never);

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.com',
      name: 'Test User',
      password: 'securepassword',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user).toEqual({
      id: validUser.id,
      email: 'test@example.com',
      name: 'Test User',
    });
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.tokens).toHaveProperty('accessToken');
    expect(res.body.data.tokens).toHaveProperty('refreshToken');
  });

  it('returns 409 when email already exists', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(validUser as never);

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.com',
      name: 'Test User',
      password: 'securepassword',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('returns 422 for invalid email format', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'not-an-email',
      name: 'Test User',
      password: 'securepassword',
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 for missing required fields', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({});

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 when password is too short', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.com',
      name: 'Test User',
      password: 'short',
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 422 when name is empty', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.com',
      name: '',
      password: 'securepassword',
    });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 200 with user and tokens on success', async () => {
    const hashedPassword = await bcrypt.hash('securepassword', 10);
    mockedPrisma.user.findUnique.mockResolvedValue({
      ...validUser,
      password: hashedPassword,
    });
    mockedPrisma.refreshToken.create.mockResolvedValue({} as never);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'securepassword',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual({
      id: validUser.id,
      email: 'test@example.com',
      name: 'Test User',
    });
    expect(res.body.data.user).not.toHaveProperty('password');
    expect(res.body.data.tokens.accessToken).toBeDefined();
    expect(res.body.data.tokens.refreshToken).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    const hashedPassword = await bcrypt.hash('securepassword', 10);
    mockedPrisma.user.findUnique.mockResolvedValue({
      ...validUser,
      password: hashedPassword,
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('returns 401 for non-existent email (same error as wrong password)', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nobody@example.com',
      password: 'somepassword',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('returns 422 for missing fields', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('returns 200 with new token pair on valid refresh token', async () => {
    const payload = { userId: validUser.id, email: validUser.email };
    const refreshToken = jwt.sign(payload, TEST_REFRESH_SECRET, { expiresIn: '7d' });

    mockedPrisma.refreshToken.findUnique.mockResolvedValue({
      id: 'token-id',
      token: 'hashed',
      userId: validUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });
    mockedPrisma.refreshToken.delete.mockResolvedValue({} as never);
    mockedPrisma.refreshToken.create.mockResolvedValue({} as never);

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    // Verify rotation: old token was deleted, new one was stored
    expect(mockedPrisma.refreshToken.delete).toHaveBeenCalled();
    expect(mockedPrisma.refreshToken.create).toHaveBeenCalled();
  });

  it('returns 401 for expired refresh token', async () => {
    const payload = { userId: validUser.id, email: validUser.email };
    const refreshToken = jwt.sign(payload, TEST_REFRESH_SECRET, { expiresIn: '-1s' });

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 401 for tampered refresh token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'invalid.token.here' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 401 when refresh token not found in DB (already used)', async () => {
    const payload = { userId: validUser.id, email: validUser.email };
    const refreshToken = jwt.sign(payload, TEST_REFRESH_SECRET, { expiresIn: '7d' });

    mockedPrisma.refreshToken.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('returns 422 for missing refreshToken field', async () => {
    const res = await request(app).post('/api/v1/auth/refresh').send({});

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns user info with valid access token', async () => {
    const payload = { userId: validUser.id, email: validUser.email };
    const accessToken = jwt.sign(payload, TEST_ACCESS_SECRET, { expiresIn: '15m' });

    mockedPrisma.user.findUnique.mockResolvedValue({
      id: validUser.id,
      email: validUser.email,
      name: validUser.name,
    } as never);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      id: validUser.id,
      email: validUser.email,
      name: validUser.name,
    });
  });

  it('returns 401 without Authorization header', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 with expired access token', async () => {
    const payload = { userId: validUser.id, email: validUser.email };
    const accessToken = jwt.sign(payload, TEST_ACCESS_SECRET, { expiresIn: '-1s' });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 with invalid access token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 with malformed Authorization header', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'NotBearer token');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('returns 204 on successful logout', async () => {
    const payload = { userId: validUser.id, email: validUser.email };
    const accessToken = jwt.sign(payload, TEST_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, TEST_REFRESH_SECRET, { expiresIn: '7d' });

    mockedPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(res.status).toBe(204);
    expect(mockedPrisma.refreshToken.deleteMany).toHaveBeenCalled();
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: 'some-token' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 204 even when refresh token does not exist (idempotent)', async () => {
    const payload = { userId: validUser.id, email: validUser.email };
    const accessToken = jwt.sign(payload, TEST_ACCESS_SECRET, { expiresIn: '15m' });

    mockedPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken: 'already-invalidated-token' });

    expect(res.status).toBe(204);
  });
});

describe('auth full flow: register → login → protected route → refresh → reject expired', () => {
  it('completes the entire auth lifecycle via API calls', async () => {
    const hashedPassword = await bcrypt.hash('securepassword', 10);

    // Step 1: Register
    mockedPrisma.user.findUnique.mockResolvedValueOnce(null);
    mockedPrisma.user.create.mockResolvedValueOnce({
      ...validUser,
      password: hashedPassword,
    });
    mockedPrisma.refreshToken.create.mockResolvedValueOnce({} as never);

    const registerRes = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.com',
      name: 'Test User',
      password: 'securepassword',
    });

    expect(registerRes.status).toBe(201);
    const registerTokens = registerRes.body.data.tokens;
    expect(registerTokens.accessToken).toBeDefined();
    expect(registerTokens.refreshToken).toBeDefined();

    // Step 2: Login
    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      ...validUser,
      password: hashedPassword,
    });
    mockedPrisma.refreshToken.create.mockResolvedValueOnce({} as never);

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'test@example.com',
      password: 'securepassword',
    });

    expect(loginRes.status).toBe(200);
    const loginTokens = loginRes.body.data.tokens;

    // Step 3: Access protected route with access token from login
    mockedPrisma.user.findUnique.mockResolvedValueOnce({
      id: validUser.id,
      email: validUser.email,
      name: validUser.name,
    } as never);

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginTokens.accessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.id).toBe(validUser.id);
    expect(meRes.body.data.email).toBe(validUser.email);

    // Step 4: Refresh token to get new token pair
    const refreshTokenHash = createHash('sha256')
      .update(loginTokens.refreshToken)
      .digest('hex');

    mockedPrisma.refreshToken.findUnique.mockResolvedValueOnce({
      id: 'token-id',
      token: refreshTokenHash,
      userId: validUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });
    mockedPrisma.refreshToken.delete.mockResolvedValueOnce({} as never);
    mockedPrisma.refreshToken.create.mockResolvedValueOnce({} as never);

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: loginTokens.refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();
    expect(refreshRes.body.data.refreshToken).toBeDefined();

    // Step 5: Reject expired access token
    const expiredToken = jwt.sign(
      { userId: validUser.id, email: validUser.email },
      TEST_ACCESS_SECRET,
      { expiresIn: '-1s' },
    );

    const expiredRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(expiredRes.status).toBe(401);
    expect(expiredRes.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('security: password hashing', () => {
  it('stores password as bcrypt hash, not plaintext', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockImplementation(async (args: { data: { password: string } }) => {
      // Verify the password passed to prisma.create is a bcrypt hash
      const storedPassword = args.data.password;
      expect(storedPassword).not.toBe('securepassword');
      expect(storedPassword).toMatch(/^\$2[aby]\$\d+\$/);
      return { ...validUser, password: storedPassword };
    });
    mockedPrisma.refreshToken.create.mockResolvedValue({} as never);

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.com',
      name: 'Test User',
      password: 'securepassword',
    });

    expect(res.status).toBe(201);
    expect(mockedPrisma.user.create).toHaveBeenCalled();
  });
});

describe('security: refresh token storage', () => {
  it('stores refresh token as SHA-256 hash in database', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedPrisma.user.create.mockResolvedValue({
      ...validUser,
      password: await bcrypt.hash('securepassword', 10),
    });

    let storedTokenHash = '';
    mockedPrisma.refreshToken.create.mockImplementation(async (args: { data: { token: string } }) => {
      storedTokenHash = args.data.token;
      return {} as never;
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'test@example.com',
      name: 'Test User',
      password: 'securepassword',
    });

    expect(res.status).toBe(201);
    const rawRefreshToken = res.body.data.tokens.refreshToken;

    // Verify stored token is SHA-256 hash of the raw token
    const expectedHash = createHash('sha256').update(rawRefreshToken).digest('hex');
    expect(storedTokenHash).toBe(expectedHash);
    // Verify it's not stored as plaintext
    expect(storedTokenHash).not.toBe(rawRefreshToken);
  });

  it('old refresh token is deleted on rotation (cannot be reused)', async () => {
    const payload = { userId: validUser.id, email: validUser.email };
    const refreshToken = jwt.sign(payload, TEST_REFRESH_SECRET, { expiresIn: '7d' });

    mockedPrisma.refreshToken.findUnique.mockResolvedValueOnce({
      id: 'old-token-id',
      token: 'hashed',
      userId: validUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    });
    mockedPrisma.refreshToken.delete.mockResolvedValueOnce({} as never);
    mockedPrisma.refreshToken.create.mockResolvedValueOnce({} as never);

    // First refresh succeeds
    const res1 = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res1.status).toBe(200);
    // Old token was deleted
    expect(mockedPrisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { id: 'old-token-id' },
    });

    // Second refresh with same token fails (not found in DB)
    mockedPrisma.refreshToken.findUnique.mockResolvedValueOnce(null);

    const res2 = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res2.status).toBe(401);
    expect(res2.body.error.code).toBe('INVALID_TOKEN');
  });

  it('logout invalidates refresh token so it cannot be used', async () => {
    const payload = { userId: validUser.id, email: validUser.email };
    const accessToken = jwt.sign(payload, TEST_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, TEST_REFRESH_SECRET, { expiresIn: '7d' });

    // Logout
    mockedPrisma.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });

    expect(logoutRes.status).toBe(204);

    // Attempt to refresh with the logged-out token
    mockedPrisma.refreshToken.findUnique.mockResolvedValue(null);

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);
    expect(refreshRes.body.error.code).toBe('INVALID_TOKEN');
  });
});
