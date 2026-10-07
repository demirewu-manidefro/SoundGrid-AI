import { Request, Response } from 'express';
import { z } from 'zod';
import { UsersService } from './users.service';
import { recordAudit } from '../../middlewares/audit.middleware';
import { UserRole } from '@prisma/client';

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(UserRole),
  tenantId: z.string().optional(),
});

const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export class UsersController {
  static async list(req: Request, res: Response): Promise<void> {
    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantFilter = isSuperAdmin ? (req.query.tenantId as string) || null : req.user?.tenantId;

    const users = await UsersService.listUsers(tenantFilter);
    res.json({ success: true, count: users.length, data: users });
  }

  static async create(req: Request, res: Response): Promise<void> {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation Error', details: parsed.error.format() });
      return;
    }

    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const targetTenantId = isSuperAdmin ? parsed.data.tenantId : req.user?.tenantId;

    // Prevent non-superadmins from assigning SUPER_ADMIN role
    if (!isSuperAdmin && parsed.data.role === UserRole.SUPER_ADMIN) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only Platform Super Admins can assign Super Admin privilege.',
      });
      return;
    }

    try {
      const user = await UsersService.createUser({
        ...parsed.data,
        tenantId: targetTenantId,
      });

      await recordAudit(req, 'USER_CREATED', `User:${user.id}`, {
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      });

      res.status(201).json({ success: true, message: 'User created successfully', data: user });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Creation Failed', message: err.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Validation Error', details: parsed.error.format() });
      return;
    }

    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantScoping = isSuperAdmin ? null : req.user?.tenantId;

    try {
      const updated = await UsersService.updateUser(req.params.id, parsed.data, tenantScoping);
      await recordAudit(req, 'USER_UPDATED', `User:${updated.id}`, parsed.data);
      res.json({ success: true, message: 'User updated successfully', data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Update Failed', message: err.message });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
    const tenantScoping = isSuperAdmin ? null : req.user?.tenantId;

    try {
      await UsersService.softDeleteUser(req.params.id, tenantScoping);
      await recordAudit(req, 'USER_DELETED', `User:${req.params.id}`);
      res.json({ success: true, message: 'User deactivated and soft-deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: 'Deletion Failed', message: err.message });
    }
  }
}
