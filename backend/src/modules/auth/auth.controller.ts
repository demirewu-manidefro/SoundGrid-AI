import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { prisma } from '../../db/prisma';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name is required'),
  organizationName: z.string().optional(),
  role: z.enum(['TECHNICIAN', 'ENTERPRISE_ADMIN']).optional(),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth',
  });
}

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          details: parsed.error.format(),
        });
        return;
      }

      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';

      const result = await AuthService.loginWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
        ipAddress,
        userAgent,
      });

      setRefreshTokenCookie(res, result.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Authentication successful',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken, // Also returned in JSON for mobile / cross-origin API clients
        user: result.user,
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: 'Authentication Failed',
        message: err.message || 'Invalid credentials.',
      });
    }
  }

  static async register(req: Request, res: Response): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: parsed.error.issues[0]?.message || 'Invalid registration input.',
          details: parsed.error.format(),
        });
        return;
      }

      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';

      const result = await AuthService.register({
        email: parsed.data.email,
        password: parsed.data.password,
        fullName: parsed.data.fullName,
        organizationName: parsed.data.organizationName,
        role: parsed.data.role,
        ipAddress,
        userAgent,
      });

      setRefreshTokenCookie(res, result.refreshToken);

      res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: 'Registration Failed',
        message: err.message || 'Unable to register account.',
      });
    }
  }

  static async googleSSO(req: Request, res: Response): Promise<void> {
    try {
      const parsed = googleAuthSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Google idToken is required.',
        });
        return;
      }

      const ipAddress = getClientIp(req);
      const userAgent = req.headers['user-agent'] || 'Unknown';

      const result = await AuthService.loginWithGoogle({
        idToken: parsed.data.idToken,
        ipAddress,
        userAgent,
      });

      setRefreshTokenCookie(res, result.refreshToken);

      res.status(200).json({
        success: true,
        message: 'Google SSO authentication successful',
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: 'SSO Authentication Failed',
        message: err.message || 'Google SSO verification failed.',
      });
    }
  }

  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!token) {
        res.status(401).json({
          success: false,
          error: 'Missing Token',
          message: 'Refresh token cookie or payload is required.',
        });
        return;
      }

      const ipAddress = getClientIp(req);
      const result = await AuthService.refreshTokens(token, ipAddress);

      setRefreshTokenCookie(res, result.refreshToken);

      res.status(200).json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (err: any) {
      res.clearCookie('refreshToken', { path: '/api/auth' });
      res.status(401).json({
        success: false,
        error: 'Token Refresh Failed',
        message: err.message || 'Failed to refresh session.',
      });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const ipAddress = getClientIp(req);

    await AuthService.logout(token, req.user?.id, ipAddress);

    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Session tokens revoked.',
    });
  }

  static async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        tenantId: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            tier: true,
            isActive: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      user,
    });
  }
}
