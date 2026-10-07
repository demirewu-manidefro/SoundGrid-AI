import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../db/prisma';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  tenantId: string | null;
  tenantSlug?: string;
  tenantName?: string;
  tenantTier?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authenticateJWT(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access token missing or invalid format. Please supply Bearer token.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { tenant: true },
    });

    if (!user || !user.isActive || user.deletedAt) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User account not found, deactivated, or revoked.',
      });
      return;
    }

    if (user.tenant && (!user.tenant.isActive || user.tenant.deletedAt)) {
      res.status(403).json({
        success: false,
        error: 'Tenant Suspended',
        message: 'The organization account associated with this user has been suspended.',
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      tenantId: user.tenantId,
      tenantSlug: user.tenant?.slug,
      tenantName: user.tenant?.name,
      tenantTier: user.tenant?.tier,
    };

    next();
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: 'Invalid Token',
      message: err.name === 'TokenExpiredError' ? 'Access token has expired.' : 'Failed to verify token signature.',
    });
  }
}
