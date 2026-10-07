import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

const ROLE_HIERARCHY_WEIGHTS: Record<UserRole, number> = {
  SUPER_ADMIN: 5,
  ENTERPRISE_ADMIN: 4,
  SAFETY_MANAGER: 3,
  TECHNICIAN: 2,
  AUDITOR: 1,
};

/**
 * Enforces that the authenticated user possesses at least one of the permitted roles.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required before checking role authorization.',
      });
      return;
    }

    if (req.user.role === UserRole.SUPER_ADMIN) {
      // Super Admin bypasses role checks
      return next();
    }

    if (allowedRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: `Access denied. Role '${req.user.role}' lacks permission for this resource. Required: [${allowedRoles.join(', ')}]`,
    });
  };
}

/**
 * Enforces organizational multi-tenant isolation.
 * Platform Super Admins can access any tenant.
 * Other roles can ONLY access their own assigned tenantId.
 */
export function enforceTenantIsolation(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  if (req.user.role === UserRole.SUPER_ADMIN) {
    return next();
  }

  const isTenantRoute = req.baseUrl.includes('tenants') || req.path.includes('tenants');
  const requestedTenantId =
    req.params.tenantId ||
    (isTenantRoute ? req.params.id : undefined) ||
    (req.query.tenantId as string) ||
    req.body?.tenantId;

  if (requestedTenantId && requestedTenantId !== req.user.tenantId) {
    res.status(403).json({
      success: false,
      error: 'Tenant Isolation Violation',
      message: 'Access denied: You cannot access or alter resources from another organization.',
    });
    return;
  }

  // Force tenantId in body/query to be user's tenantId if not super admin
  if (req.body && typeof req.body === 'object') {
    req.body.tenantId = req.user.tenantId;
  }

  next();
}

/**
 * Enforces read-only access for Third-Party Auditors (Tier 5).
 * Blocks any mutation attempt (POST, PUT, PATCH, DELETE) by an auditor.
 */
export function enforceAuditorReadOnly(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    return next();
  }

  if (req.user.role === UserRole.AUDITOR) {
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase());
    if (isMutation) {
      res.status(403).json({
        success: false,
        error: 'Auditor Read-Only Violation',
        message: 'Third-Party Auditor role is strictly read-only. Mutation requests are blocked.',
      });
      return;
    }
  }

  next();
}
