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

// Read endpoints: accessible to all 3 tiers
router.get(
  '/',
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ENTERPRISE_ADMIN,
    UserRole.TECHNICIAN
  ),
  DiagnosticsController.list
);

router.get(
  '/:id',
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ENTERPRISE_ADMIN,
    UserRole.TECHNICIAN
  ),
  DiagnosticsController.getById
);

// Trigger Diagnostic: Tier 3 Field Technician, Enterprise Admin, Super Admin
// Protected by diagnostic sliding token bucket, Multer file upload, and deep magic bytes inspection
router.post(
  '/',
  requireRole(
    UserRole.SUPER_ADMIN,
    UserRole.ENTERPRISE_ADMIN,
    UserRole.TECHNICIAN
  ),
  diagnosticRateLimiter,
  audioUploadMiddleware,
  validateAudioPayload,
  DiagnosticsController.uploadAndDiagnose
);

export default router;
