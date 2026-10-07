import { Router } from 'express';
import { DiagnosticsController } from './diagnostics.controller';
import { authenticateJWT } from '../../middlewares/auth.middleware';
import { requireRole, enforceTenantIsolation, enforceAuditorReadOnly } from '../../middlewares/rbac.middleware';
import { audioUploadMiddleware, validateAudioPayload } from '../../middlewares/uploadValidator.middleware';
import { diagnosticRateLimiter } from '../../middlewares/rateLimiter.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateJWT);
router.use(enforceTenantIsolation);

// Read endpoints: accessible to all tiers (including Tier 5 Auditor)
router.get(
  '/',
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ENTERPRISE_ADMIN,
    UserRole.SAFETY_MANAGER,
    UserRole.TECHNICIAN,
    UserRole.AUDITOR
  ),
  DiagnosticsController.list
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
  DiagnosticsController.getById
);

// Trigger Diagnostic: Tier 4 Field Technician, Safety Manager, Enterprise Admin, Super Admin
// Protected by diagnostic sliding token bucket, Multer file upload, and deep magic bytes inspection
router.post(
  '/',
  enforceAuditorReadOnly,
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ENTERPRISE_ADMIN,
    UserRole.SAFETY_MANAGER,
    UserRole.TECHNICIAN
  ),
  diagnosticRateLimiter,
  audioUploadMiddleware,
  validateAudioPayload,
  DiagnosticsController.uploadAndDiagnose
);

export default router;
