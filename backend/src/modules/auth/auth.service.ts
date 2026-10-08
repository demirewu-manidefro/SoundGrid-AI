import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../db/prisma';
import { verifyPassword } from '../../utils/argon';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../../utils/jwt';
import { AuditService } from '../audit/audit.service';
import { ENV } from '../../config/env';
import { UserRole } from '@prisma/client';

const googleClient = new OAuth2Client(ENV.GOOGLE_CLIENT_ID);

export class AuthService {
  /**
   * Dual-mechanism login: Argon2id password-based authentication.
   */
  static async loginWithPassword(params: {
    email: string;
    password: string;
    ipAddress: string;
    userAgent: string;
  }) {
    const user = await prisma.user.findUnique({
      where: { email: params.email.toLowerCase().trim() },
      include: { tenant: true },
    });

    if (!user || !user.passwordHash || user.deletedAt) {
      await AuditService.record({
        action: 'AUTH_LOGIN_FAILED',
        resource: `User:${params.email}`,
        ipAddress: params.ipAddress,
        metadata: { reason: 'User not found or deleted', userAgent: params.userAgent },
      });
      throw new Error('Invalid email or password.');
    }

    if (!user.isActive) {
      await AuditService.record({
        actorId: user.id,
        tenantId: user.tenantId,
        action: 'AUTH_LOGIN_REJECTED',
        resource: `User:${user.id}`,
        ipAddress: params.ipAddress,
        metadata: { reason: 'Account deactivated', userAgent: params.userAgent },
      });
      throw new Error('This account has been deactivated. Please contact your administrator.');
    }

    if (user.tenant && (!user.tenant.isActive || user.tenant.deletedAt)) {
      await AuditService.record({
        actorId: user.id,
        tenantId: user.tenantId,
        action: 'AUTH_LOGIN_REJECTED',
        resource: `Tenant:${user.tenantId}`,
        ipAddress: params.ipAddress,
        metadata: { reason: 'Organization suspended', userAgent: params.userAgent },
      });
      throw new Error('Your organization account has been suspended.');
    }

    const isValidPassword = await verifyPassword(params.password, user.passwordHash);
    if (!isValidPassword) {
      await AuditService.record({
        actorId: user.id,
        tenantId: user.tenantId,
        action: 'AUTH_LOGIN_FAILED',
        resource: `User:${user.id}`,
        ipAddress: params.ipAddress,
        metadata: { reason: 'Invalid password', userAgent: params.userAgent },
      });
      throw new Error('Invalid email or password.');
    }

    // Update lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session tokens
    const { accessToken, refreshToken } = await this.issueTokenPair(user);

    await AuditService.record({
      actorId: user.id,
      tenantId: user.tenantId,
      action: 'AUTH_LOGIN_SUCCESS',
      resource: `User:${user.id}`,
      ipAddress: params.ipAddress,
      metadata: { role: user.role, userAgent: params.userAgent },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant ? { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug, tier: user.tenant.tier } : null,
      },
    };
  }

  /**
   * Dual-mechanism login: Google OAuth 2.0 Single Sign-On (SSO).
   */
  static async loginWithGoogle(params: {
    idToken: string;
    ipAddress: string;
    userAgent: string;
  }) {
    let email: string;
    let fullName: string;
    let googleId: string;

    // Verify token using google-auth-library with fallback for testing
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: params.idToken,
        audience: ENV.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new Error('Invalid Google payload.');
      }
      email = payload.email.toLowerCase().trim();
      fullName = payload.name || 'Google User';
      googleId = payload.sub;
    } catch (verifyErr) {
      // Allow mock token in development / test environments: e.g. "mock-google-token:<email>"
      if (ENV.NODE_ENV !== 'production' && params.idToken.startsWith('mock-google-token:')) {
        email = params.idToken.split(':')[1]?.toLowerCase().trim() || 'demo@apexpower.com';
        fullName = 'Google SSO Demo User';
        googleId = `google_mock_${email}`;
      } else {
        throw new Error('Google token verification failed.');
      }
    }

    let user = await prisma.user.findFirst({
      where: { OR: [{ email }, { googleId }] },
      include: { tenant: true },
    });

    if (!user) {
      // Find default tenant (Apex Power) or create pending user
      const defaultTenant = await prisma.tenant.findFirst({ where: { slug: 'apex-power' } });
      user = await prisma.user.create({
        data: {
          email,
          fullName,
          googleId,
          role: UserRole.TECHNICIAN,
          tenantId: defaultTenant?.id || null,
          isActive: true,
          lastLoginAt: new Date(),
        },
        include: { tenant: true },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, lastLoginAt: new Date() },
        include: { tenant: true },
      });
    }

    if (!user.isActive || user.deletedAt) {
      throw new Error('Account deactivated.');
    }

    if (user.tenant && (!user.tenant.isActive || user.tenant.deletedAt)) {
      await AuditService.record({
        actorId: user.id,
        tenantId: user.tenantId,
        action: 'AUTH_LOGIN_REJECTED',
        resource: `Tenant:${user.tenantId}`,
        ipAddress: params.ipAddress,
        metadata: { reason: 'Organization suspended', userAgent: params.userAgent },
      });
      throw new Error('Your organization account has been suspended.');
    }

    const { accessToken, refreshToken } = await this.issueTokenPair(user);

    await AuditService.record({
      actorId: user.id,
      tenantId: user.tenantId,
      action: 'AUTH_GOOGLE_SSO_SUCCESS',
      resource: `User:${user.id}`,
      ipAddress: params.ipAddress,
      metadata: { role: user.role, userAgent: params.userAgent },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant ? { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug, tier: user.tenant.tier } : null,
      },
    };
  }

  /**
   * Refreshes access token and rotates revocable refresh token.
   */
  static async refreshTokens(rawRefreshToken: string, ipAddress: string) {
    if (!rawRefreshToken) {
      throw new Error('Refresh token missing.');
    }

    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new Error('Invalid or expired refresh token.');
    }

    const tokenHash = hashToken(rawRefreshToken);
    const existingToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { tenant: true } } },
    });

    if (!existingToken || existingToken.revoked || existingToken.expiresAt < new Date()) {
      throw new Error('Refresh token has been revoked or expired.');
    }

    // Revoke old token for token rotation security
    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revoked: true },
    });

    const user = existingToken.user;
    if (!user.isActive || user.deletedAt) {
      throw new Error('User account inactive.');
    }

    const { accessToken, refreshToken: newRefreshToken } = await this.issueTokenPair(user);

    await AuditService.record({
      actorId: user.id,
      tenantId: user.tenantId,
      action: 'AUTH_TOKEN_ROTATED',
      resource: `RefreshToken:${existingToken.id}`,
      ipAddress,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant ? { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug, tier: user.tenant.tier } : null,
      },
    };
  }

  /**
   * Explicitly revokes refresh token on user logout.
   */
  static async logout(rawRefreshToken: string | undefined, userId?: string, ipAddress?: string) {
    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revoked: true },
      });
    }

    if (userId) {
      await AuditService.record({
        actorId: userId,
        action: 'AUTH_LOGOUT',
        resource: `User:${userId}`,
        ipAddress: ipAddress || '127.0.0.1',
      });
    }
  }

  /**
   * Helper to generate signed JWT access token and save hashed refresh token.
   */
  private static async issueTokenPair(user: { id: string; email: string; role: UserRole; tenantId: string | null }) {
    const accessToken = signAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    });

    // 7 days expiration for refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Initial temporary entry to get an ID
    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: 'temp-' + Math.random(),
        expiresAt,
      },
    });

    const rawRefreshToken = signRefreshToken({
      userId: user.id,
      tokenId: refreshTokenRecord.id,
    });

    // Update with real SHA-256 hash
    await prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: {
        tokenHash: hashToken(rawRefreshToken),
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }
}
