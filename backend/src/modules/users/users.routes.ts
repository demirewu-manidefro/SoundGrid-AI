import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireRole, enforceTenantIsolation, enforceAuditorReadOnly } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);
router.use(enforceTenantIsolation);

// Read access allowed for Super Admin and Enterprise Admin
router.get(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN),
  UsersController.list
);

// Mutations require Enterprise Admin or Super Admin
router.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN),
  UsersController.create
);

router.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN),
  UsersController.update
);

router.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN),
  UsersController.delete
);

export default router;
