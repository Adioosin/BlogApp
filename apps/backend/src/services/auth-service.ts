import { createHash } from 'node:crypto';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import type { AuthResponse, AuthTokens, LoginRequest, RegisterRequest, TokenPayload, UserRole } from '@blogapp/types';

import { prisma } from '../lib/prisma.js';
import { env } from '../lib/env.js';
import type { AppError } from '../middleware/error-handler.js';

const SALT_ROUNDS = 10;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateTokens(payload: TokenPayload): AuthTokens {
  const accessToken = jwt.sign(payload, env('JWT_ACCESS_SECRET'), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign(payload, env('JWT_REFRESH_SECRET'), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { accessToken, refreshToken };
}

function toUserDto(user: { id: string; email: string; name: string; role: UserRole }) {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

async function storeRefreshToken(token: string, userId: string): Promise<void> {
  const decoded = jwt.decode(token) as jwt.JwtPayload;
  const expiresAt = new Date((decoded.exp as number) * 1000);

  await prisma.refreshToken.create({
    data: {
      token: hashToken(token),
      userId,
      expiresAt,
    },
  });
}

async function registerUser(data: RegisterRequest): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const error = new Error('Email already in use') as AppError;
    error.statusCode = 409;
    error.code = 'EMAIL_TAKEN';
    throw error;
  }

  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hashedPassword,
    },
  });

  const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role as UserRole });
  await storeRefreshToken(tokens.refreshToken, user.id);

  return { user: toUserDto(user), tokens };
}

async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    const error = new Error('Invalid email or password') as AppError;
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) {
    const error = new Error('Invalid email or password') as AppError;
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const tokens = generateTokens({ userId: user.id, email: user.email, role: user.role as UserRole });
  await storeRefreshToken(tokens.refreshToken, user.id);

  return { user: toUserDto(user), tokens };
}

async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  let payload: TokenPayload;
  try {
    payload = jwt.verify(refreshToken, env('JWT_REFRESH_SECRET')) as TokenPayload;
  } catch {
    const error = new Error('Invalid refresh token') as AppError;
    error.statusCode = 401;
    error.code = 'INVALID_TOKEN';
    throw error;
  }

  const hashed = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { token: hashed } });
  if (!stored) {
    const error = new Error('Invalid refresh token') as AppError;
    error.statusCode = 401;
    error.code = 'INVALID_TOKEN';
    throw error;
  }

  // Rotate: delete old token
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const tokens = generateTokens({ userId: payload.userId, email: payload.email, role: payload.role });
  await storeRefreshToken(tokens.refreshToken, payload.userId);

  return tokens;
}

async function logoutUser(refreshToken: string): Promise<void> {
  const hashed = hashToken(refreshToken);
  await prisma.refreshToken.deleteMany({ where: { token: hashed } });
}

export { registerUser, loginUser, refreshTokens, logoutUser };
