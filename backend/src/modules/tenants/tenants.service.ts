import { prisma } from '../../db/prisma';
import { TenantTier } from '@prisma/client';

export class TenantsService {
  static async listAll() {
    return prisma.tenant.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { users: true, machines: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async findById(id: string) {
    return prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true, machines: true },
        },
        users: {
          select: { id: true, email: true, fullName: true, role: true, isActive: true },
        },
      },
    });
  }

  static async createTenant(data: { name: string; slug: string; tier?: TenantTier }) {
    return prisma.tenant.create({
      data: {
        name: data.name,
        slug: data.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-'),
        tier: data.tier || TenantTier.ENTERPRISE,
        isActive: true,
      },
    });
  }

  static async updateTenant(id: string, data: { name?: string; tier?: TenantTier; isActive?: boolean }) {
    return prisma.tenant.update({
      where: { id },
      data,
    });
  }
}
