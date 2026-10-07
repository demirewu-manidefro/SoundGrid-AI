import { Request, Response } from 'express';
import { z } from 'zod';
import { MachinesService } from './machines.service';
import { recordAudit } from '../../middlewares/audit.middleware';
import { MachineType, MachineStatus, UserRole } from '@prisma/client';

const createMachineSchema = z.object({
  name: z.string().min(2),
  machineType: z.nativeEnum(MachineType),
  serialNumber: z.string().min(3),
  location: z.string().min(2),
  tenantId: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(MachineStatus),
});

export class MachinesController {
  static async list(req: Request, res: Response): Promise<void> {
    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantId = isSuperAdmin ? (req.query.tenantId as string) || null : req.user?.tenantId;
    const type = req.query.type as MachineType | undefined;
    const status = req.query.status as MachineStatus | undefined;

    const machines = await MachinesService.listMachines(tenantId, type, status);
    res.json({ success: true, count: machines.length, data: machines });
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantId = isSuperAdmin ? null : req.user?.tenantId;

    const machine = await MachinesService.getById(req.params.id, tenantId);
    if (!machine) {
      res.status(404).json({ success: false, error: 'Machine Not Found' });
      return;
    }
    res.json({ success: true, data: machine });
  }

  static async create(req: Request, res: Response): Promise<void> {
    const parsed = createMachineSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation Error', details: parsed.error.format() });
      return;
    }

    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantId = isSuperAdmin ? (parsed.data.tenantId || req.user?.tenantId) : req.user?.tenantId;

    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Missing Tenant', message: 'Tenant ID is required to register machinery.' });
      return;
    }

    try {
      const machine = await MachinesService.createMachine({
        ...parsed.data,
        tenantId,
      });

      await recordAudit(req, 'MACHINE_CREATED', `Machine:${machine.id}`, {
        name: machine.name,
        serialNumber: machine.serialNumber,
        machineType: machine.machineType,
      });

      res.status(201).json({ success: true, message: 'Machine registered successfully', data: machine });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Creation Failed', message: err.message });
    }
  }

  static async updateStatus(req: Request, res: Response): Promise<void> {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation Error', details: parsed.error.format() });
      return;
    }

    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantId = isSuperAdmin ? null : req.user?.tenantId;

    try {
      const updated = await MachinesService.updateStatus(req.params.id, parsed.data.status, tenantId);
      await recordAudit(req, 'MACHINE_STATUS_UPDATED', `Machine:${updated.id}`, {
        status: updated.status,
      });

      res.json({ success: true, message: 'Machine status updated', data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Update Failed', message: err.message });
    }
  }
}
