import { Request, Response } from 'express';
import { z } from 'zod';
import { TicketsService } from './tickets.service';
import { TicketPriority, TicketStatus, UserRole } from '@prisma/client';

const assignTicketSchema = z.object({
  assignedToId: z.string().uuid(),
});

const resolveTicketSchema = z.object({
  resolutionNotes: z.string().min(5),
});

export class TicketsController {
  static async list(req: Request, res: Response): Promise<void> {
    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantId = isSuperAdmin ? (req.query.tenantId as string) || null : req.user?.tenantId;
    const status = req.query.status as TicketStatus | undefined;
    const priority = req.query.priority as TicketPriority | undefined;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '20', 10);

    const result = await TicketsService.listTickets({
      tenantId,
      status,
      priority,
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

  static async assign(req: Request, res: Response): Promise<void> {
    const parsed = assignTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation Error', details: parsed.error.format() });
      return;
    }

    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantId = isSuperAdmin ? null : req.user?.tenantId;

    try {
      const ticket = await TicketsService.assignTicket(req.params.id, parsed.data.assignedToId, tenantId);
      res.json({ success: true, message: 'Ticket assigned successfully', data: ticket });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Assignment Failed', message: err.message });
    }
  }

  static async resolve(req: Request, res: Response): Promise<void> {
    const parsed = resolveTicketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation Error', details: parsed.error.format() });
      return;
    }

    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantId = isSuperAdmin ? null : req.user?.tenantId;
    const resolvedById = req.user!.id;
    const ipAddress =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0].trim()
        : req.ip) || '127.0.0.1';

    try {
      const ticket = await TicketsService.resolveTicket({
        id: req.params.id,
        resolutionNotes: parsed.data.resolutionNotes,
        resolvedById,
        tenantId,
        ipAddress,
      });

      res.json({
        success: true,
        message: 'Ticket resolved and machine state restored to OPERATIONAL.',
        data: ticket,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Resolution Failed', message: err.message });
    }
  }
}
