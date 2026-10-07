import { Router } from 'express';
import { MachinesController } from './machines.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireRole, enforceTenantIsolation, enforceAuditorReadOnly } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);
router.use(enforceTenantIsolation);

// Read endpoints accessible to all 5 tiers
router.get(
  '/',
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ENTERPRISE_ADMIN,
    UserRole.SAFETY_MANAGER,
    UserRole.TECHNICIAN,
    UserRole.AUDITOR
  ),
  MachinesController.list
);

router.get(
  '/:id',
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ENTERPRISE_ADMIN,
    UserRole.SAFETY_MANAGER,
    UserRole.TECHNICIAN,
    UserRole.AUDITOR
  ),
  MachinesController.getById
);

// Machinery registration: Enterprise Admin / Super Admin
router.post(
  '/',
  enforceAuditorReadOnly,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN),
  MachinesController.create
);

// Machinery status override: Safety Manager / Enterprise Admin / Super Admin
router.patch(
  '/:id/status',
  enforceAuditorReadOnly,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN, UserRole.SAFETY_MANAGER),
  MachinesController.updateStatus
);

export default router;
