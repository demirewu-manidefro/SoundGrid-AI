import { Router } from 'express';
import { TicketsController } from './tickets.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireRole, enforceTenantIsolation, enforceAuditorReadOnly } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);
router.use(enforceTenantIsolation);

// Read tickets: all 3 tiers
router.get(
  '/',
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ENTERPRISE_ADMIN,
    UserRole.TECHNICIAN
  ),
  TicketsController.list
);

// Assign work order: Enterprise Admin / Super Admin
router.post(
  '/:id/assign',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN),
  TicketsController.assign
);

// Resolve & approve machine status: Enterprise Admin / Super Admin
router.post(
  '/:id/resolve',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN),
  TicketsController.resolve
);

export default router;
