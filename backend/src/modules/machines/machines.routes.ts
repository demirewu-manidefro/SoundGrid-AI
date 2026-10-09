import { Router } from 'express';
import { MachinesController } from './machines.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireRole, enforceTenantIsolation, enforceAuditorReadOnly } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);
router.use(enforceTenantIsolation);

// Read endpoints accessible to all 3 tiers
router.get(
  '/',
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ENTERPRISE_ADMIN,
    UserRole.TECHNICIAN
  ),
  MachinesController.list
);

router.get(
  '/:id',
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ENTERPRISE_ADMIN,
    UserRole.TECHNICIAN
  ),
  MachinesController.getById
);

// Machinery registration: Enterprise Admin / Super Admin
router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN),
  MachinesController.create
);

// Machinery status override: Enterprise Admin / Super Admin
router.patch(
  '/:id/status',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN),
  MachinesController.updateStatus
);

export default router;
