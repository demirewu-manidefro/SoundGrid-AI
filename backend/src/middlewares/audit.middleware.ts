import { Request } from 'express';
import { AuditService } from '../modules/audit/audit.service';

export function recordAudit(
  req: Request,
  action: string,
  resource: string,
  metadata?: Record<string, any>
) {
  const ipAddress =
    (typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0].trim()
      : req.ip) ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  return AuditService.record({
    actorId: req.user?.id || null,
    tenantId: req.user?.tenantId || null,
    action,
    resource,
    ipAddress,
    metadata: {
      userAgent: req.headers['user-agent'] || 'Unknown',
      path: req.originalUrl,
      method: req.method,
      ...metadata,
    },
  });
}
