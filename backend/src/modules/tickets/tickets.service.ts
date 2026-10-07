import { prisma } from '../../db/prisma';
import { TicketStatus, TicketPriority, MachineStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

export class TicketsService {
  static async listTickets(options: {
    tenantId?: string | null;
    status?: TicketStatus;
    priority?: TicketPriority;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (options.status) where.status = options.status;
    if (options.priority) where.priority = options.priority;
    if (options.tenantId) {
      where.diagnostic = {
        machine: { tenantId: options.tenantId },
      };
    }

    const [total, items] = await Promise.all([
      prisma.maintenanceTicket.count({ where }),
      prisma.maintenanceTicket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: { id: true, fullName: true, email: true, role: true },
          },
          diagnostic: {
            include: {
              machine: {
                select: { id: true, name: true, serialNumber: true, location: true, machineType: true, status: true },
              },
              technician: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
        },
      }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  static async assignTicket(id: string, assignedToId: string, tenantId?: string | null) {
    const ticket = await prisma.maintenanceTicket.findFirst({
      where: {
        id,
        ...(tenantId ? { diagnostic: { machine: { tenantId } } } : {}),
      },
    });

    if (!ticket) throw new Error('Ticket not found or unauthorized.');

    return prisma.maintenanceTicket.update({
      where: { id },
      data: {
        assignedToId,
        status: TicketStatus.IN_PROGRESS,
      },
      include: {
        assignedTo: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  static async resolveTicket(params: {
    id: string;
    resolutionNotes: string;
    resolvedById: string;
    tenantId?: string | null;
    ipAddress: string;
  }) {
    const ticket = await prisma.maintenanceTicket.findFirst({
      where: {
        id: params.id,
        ...(params.tenantId ? { diagnostic: { machine: { tenantId: params.tenantId } } } : {}),
      },
      include: {
        diagnostic: { include: { machine: true } },
      },
    });

    if (!ticket) throw new Error('Ticket not found or unauthorized.');

    // Update ticket state to RESOLVED
    const resolvedTicket = await prisma.maintenanceTicket.update({
      where: { id: params.id },
      data: {
        status: TicketStatus.RESOLVED,
        resolutionNotes: params.resolutionNotes,
        resolvedAt: new Date(),
      },
    });

    // Plant Safety Manager approval: restore machine status to OPERATIONAL
    await prisma.machine.update({
      where: { id: ticket.diagnostic.machineId },
      data: { status: MachineStatus.OPERATIONAL },
    });

    // Record audit log
    await AuditService.record({
      actorId: params.resolvedById,
      tenantId: ticket.diagnostic.machine.tenantId,
      action: 'TICKET_RESOLVED_AND_APPROVED',
      resource: `Ticket:${ticket.id}`,
      ipAddress: params.ipAddress,
      metadata: {
        machineId: ticket.diagnostic.machineId,
        restoredStatus: MachineStatus.OPERATIONAL,
        notes: params.resolutionNotes,
      },
    });

    return resolvedTicket;
  }
}
