import { Request, Response } from 'express';
import { AuditService } from './audit.service';
import { UserRole } from '@prisma/client';

export class AuditController {
  static async listLogs(req: Request, res: Response): Promise<void> {
    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantId = isSuperAdmin ? (req.query.tenantId as string) || null : req.user?.tenantId;

    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '25', 10);
    const action = req.query.action as string | undefined;

    const result = await AuditService.queryLogs({
      tenantId,
      page,
      limit,
      action,
    });

    res.json({
      success: true,
      data: result.items,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  }
}
