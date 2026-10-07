import { Request, Response } from 'express';
import { z } from 'zod';
import { TenantsService } from './tenants.service';
import { recordAudit } from '../../middlewares/audit.middleware';
import { TenantTier } from '@prisma/client';

const createTenantSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  tier: z.nativeEnum(TenantTier).optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  tier: z.nativeEnum(TenantTier).optional(),
  isActive: z.boolean().optional(),
});

export class TenantsController {
  static async list(req: Request, res: Response): Promise<void> {
    const tenants = await TenantsService.listAll();
    res.json({ success: true, count: tenants.length, data: tenants });
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const tenant = await TenantsService.findById(req.params.id);
    if (!tenant) {
      res.status(404).json({ success: false, error: 'Tenant Not Found' });
      return;
    }
    res.json({ success: true, data: tenant });
  }

  static async create(req: Request, res: Response): Promise<void> {
    const parsed = createTenantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation Error', details: parsed.error.format() });
      return;
    }

    try {
      const tenant = await TenantsService.createTenant(parsed.data);
      await recordAudit(req, 'TENANT_CREATED', `Tenant:${tenant.id}`, { name: tenant.name, tier: tenant.tier });
      res.status(201).json({ success: true, message: 'Tenant onboarded successfully', data: tenant });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Creation Failed', message: err.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    const parsed = updateTenantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation Error', details: parsed.error.format() });
      return;
    }

    try {
      const tenant = await TenantsService.updateTenant(req.params.id, parsed.data);
      await recordAudit(req, 'TENANT_UPDATED', `Tenant:${tenant.id}`, parsed.data);
      res.json({ success: true, message: 'Tenant updated successfully', data: tenant });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Update Failed', message: err.message });
    }
  }
}
