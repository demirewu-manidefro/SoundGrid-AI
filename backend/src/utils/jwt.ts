import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UserRole } from '@prisma/client';
import { ENV } from '../config/env';

export interface TokenPayload {
  userId: string;
  tenantId: string | null;
  role: UserRole;
  email: string;
}

export interface RefreshPayload {
  userId: string;
  tokenId: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ENV.JWT_ACCESS_SECRET, {
    expiresIn: ENV.JWT_ACCESS_EXPIRES_IN as any,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as TokenPayload;
}

export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as any,
  });
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as RefreshPayload;
}

/**
 * Creates a deterministic SHA-256 hash of the token for revocable storage in DB.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
