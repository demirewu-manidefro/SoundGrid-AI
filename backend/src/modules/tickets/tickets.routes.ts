import { Router } from 'express';
import { TicketsController } from './tickets.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireRole, enforceTenantIsolation, enforceAuditorReadOnly } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);
router.use(enforceTenantIsolation);

// Read tickets: all tiers
router.get(
  '/',
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ENTERPRISE_ADMIN,
    UserRole.SAFETY_MANAGER,
    UserRole.TECHNICIAN,
    UserRole.AUDITOR
  ),
  TicketsController.list
);

// Assign work order: Safety Manager / Enterprise Admin / Super Admin
router.post(
  '/:id/assign',
  enforceAuditorReadOnly,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN, UserRole.SAFETY_MANAGER),
  TicketsController.assign
);

// Resolve & approve machine status: Safety Manager / Enterprise Admin / Super Admin
router.post(
  '/:id/resolve',
  enforceAuditorReadOnly,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN, UserRole.SAFETY_MANAGER),
  TicketsController.resolve
);

export default router;
