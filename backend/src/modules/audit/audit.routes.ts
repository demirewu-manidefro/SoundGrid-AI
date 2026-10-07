import { Router } from 'express';
import { AuditController } from './audit.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);

// Only Super Admin, Enterprise Admin, Safety Manager, and Auditor can view audit logs
router.get(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ENTERPRISE_ADMIN, UserRole.SAFETY_MANAGER, UserRole.AUDITOR),
  AuditController.listLogs
);

export default router;
