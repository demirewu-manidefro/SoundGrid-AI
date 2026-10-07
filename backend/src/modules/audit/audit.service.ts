import { prisma } from '../../db/prisma';

export interface CreateAuditLogParams {
  actorId?: string | null;
  tenantId?: string | null;
  action: string;
  resource: string;
  ipAddress: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  /**
   * Appends an immutable audit log entry to PostgreSQL.
   */
  static async record(params: CreateAuditLogParams) {
    try {
      return await prisma.auditLog.create({
        data: {
          actorId: params.actorId || null,
          tenantId: params.tenantId || null,
          action: params.action,
          resource: params.resource,
          ipAddress: params.ipAddress,
          metadata: params.metadata || {},
        },
      });
    } catch (err) {
      console.error('⚠️ Failed to append audit log:', err);
      // Non-blocking for system operations, but logged
      return null;
    }
  }

  /**
   * Queries audit logs with pagination and multi-tenant scoping.
   */
  static async queryLogs(options: {
    tenantId?: string | null;
    actorId?: string;
    action?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.tenantId) {
      where.tenantId = options.tenantId;
    }
    if (options.actorId) {
      where.actorId = options.actorId;
    }
    if (options.action) {
      where.action = { contains: options.action, mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, email: true, fullName: true, role: true },
          },
          tenant: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
