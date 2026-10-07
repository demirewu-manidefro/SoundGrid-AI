import { Request, Response } from 'express';
import { DiagnosticsService } from './diagnostics.service';
import { UserRole } from '@prisma/client';

export class DiagnosticsController {
  static async uploadAndDiagnose(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'Missing Audio File',
        message: 'An audio file must be uploaded under the field name "audio".',
      });
      return;
    }

    const { machineId, technicianNotes } = req.body;
    if (!machineId) {
      res.status(400).json({
        success: false,
        error: 'Missing Machine ID',
        message: 'A valid machineId must be provided in the request body.',
      });
      return;
    }

    const technicianId = req.user?.id;
    if (!technicianId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantId = isSuperAdmin ? null : req.user?.tenantId;

    const ipAddress =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : req.ip) || '127.0.0.1';

    try {
      const result = await DiagnosticsService.runDiagnostic({
        machineId,
        technicianId,
        tenantId,
        fileBuffer: req.file.buffer,
        fileName: req.file.originalname,
        technicianNotes,
        ipAddress,
      });

      res.status(201).json({
        success: true,
        message: 'Diagnostic audio processed and evaluated successfully.',
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: 'Diagnostic Evaluation Failed',
        message: err.message,
      });
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantId = isSuperAdmin ? (req.query.tenantId as string) || null : req.user?.tenantId;
    const machineId = req.query.machineId as string | undefined;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);

    const result = await DiagnosticsService.listDiagnostics({
      tenantId,
      machineId,
      page,
      limit,
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

  static async getById(req: Request, res: Response): Promise<void> {
    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantId = isSuperAdmin ? null : req.user?.tenantId;

    const record = await DiagnosticsService.getById(req.params.id, tenantId);
    if (!record) {
      res.status(404).json({ success: false, error: 'Diagnostic Record Not Found' });
      return;
    }

    res.json({ success: true, data: record });
  }
}
