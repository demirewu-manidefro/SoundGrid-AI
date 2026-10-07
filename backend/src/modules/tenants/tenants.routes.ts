import { Router } from 'express';
import { TenantsController } from './tenants.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireRole, enforceTenantIsolation, enforceAuditorReadOnly } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);
router.use(enforceAuditorReadOnly);

// Tier 1 Platform Super Admin only
router.get('/', requireRole(UserRole.SUPER_ADMIN), TenantsController.list);
router.post('/', requireRole(UserRole.SUPER_ADMIN), TenantsController.create);
router.patch('/:id', requireRole(UserRole.SUPER_ADMIN), TenantsController.update);

// Super Admin or Tenant Admin
router.get('/:id', enforceTenantIsolation, TenantsController.getById);

export default router;
