import { prisma } from '../../db/prisma';
import { hashPassword } from '../../utils/argon';
import { UserRole } from '@prisma/client';

export class UsersService {
  static async listUsers(tenantId?: string | null) {
    const where: any = { deletedAt: null };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        tenantId: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createUser(data: {
    email: string;
    fullName: string;
    password?: string;
    role: UserRole;
    tenantId?: string | null;
  }) {
    const passwordHash = await hashPassword(data.password || 'TemporaryPassword123!');

    return prisma.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        fullName: data.fullName,
        role: data.role,
        tenantId: data.tenantId || null,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        tenantId: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  static async updateUser(
    id: string,
    data: { fullName?: string; role?: UserRole; isActive?: boolean },
    tenantId?: string | null
  ) {
    const where: any = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    return prisma.user.update({
      where,
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        tenantId: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  static async softDeleteUser(id: string, tenantId?: string | null) {
    const where: any = { id };
    if (tenantId) {
      where.tenantId = tenantId;
    }

    return prisma.user.update({
      where,
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
