import { prisma } from '../../db/prisma';
import { MachineType, MachineStatus } from '@prisma/client';

export class MachinesService {
  static async listMachines(tenantId?: string | null, type?: MachineType, status?: MachineStatus) {
    const where: any = { deletedAt: null };
    if (tenantId) where.tenantId = tenantId;
    if (type && (type as string) !== 'undefined') where.machineType = type;
    if (status && (status as string) !== 'undefined') where.status = status;

    return prisma.machine.findMany({
      where,
      include: {
        tenant: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { diagnostics: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(id: string, tenantId?: string | null) {
    const where: any = { id, deletedAt: null };
    if (tenantId) where.tenantId = tenantId;

    return prisma.machine.findFirst({
      where,
      include: {
        tenant: { select: { id: true, name: true, slug: true } },
        diagnostics: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            technician: { select: { id: true, fullName: true, email: true } },
            maintenanceTicket: true,
          },
        },
      },
    });
  }

  static async createMachine(data: {
    name: string;
    machineType: MachineType;
    serialNumber: string;
    location: string;
    tenantId: string;
  }) {
    return prisma.machine.create({
      data: {
        name: data.name,
        machineType: data.machineType,
        serialNumber: data.serialNumber.trim().toUpperCase(),
        location: data.location,
        tenantId: data.tenantId,
        status: MachineStatus.OPERATIONAL,
      },
    });
  }

  static async updateStatus(id: string, status: MachineStatus, tenantId?: string | null) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;

    return prisma.machine.update({
      where,
      data: { status },
    });
  }
}
