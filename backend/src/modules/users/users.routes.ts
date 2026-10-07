import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireRole, enforceTenantIsolation, enforceAuditorReadOnly } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);
router.use(enforceTenantIsolation);

// Read-only access allowed for Super Admin, Enterprise Admin, Safety Manager, and Auditor
router.get(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN, UserRole.SAFETY_MANAGER, UserRole.AUDITOR),
  UsersController.list
);

// Mutations require at least Enterprise Admin, and blocked for Auditors
router.post(
  '/',
  enforceAuditorReadOnly,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN),
  UsersController.create
);

router.patch(
  '/:id',
  enforceAuditorReadOnly,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN),
  UsersController.update
);

router.delete(
  '/:id',
  enforceAuditorReadOnly,
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN),
  UsersController.delete
);

export default router;
