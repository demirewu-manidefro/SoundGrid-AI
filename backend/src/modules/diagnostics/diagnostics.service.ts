import fs from 'fs';
import path from 'path';
import { prisma } from '../../db/prisma';
import { ENV } from '../../config/env';
import { AuditService } from '../audit/audit.service';
import { MachineStatus, TicketPriority, TicketStatus } from '@prisma/client';

const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads/diagnostics');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export class DiagnosticsService {
  /**
   * Securely forwards validated audio to FastAPI AI Microservice,
   * stores diagnostic record, handles automated machine alerting, and creates maintenance tickets.
   */
  static async runDiagnostic(params: {
    machineId: string;
    technicianId: string;
    tenantId?: string | null;
    fileBuffer: Buffer;
    fileName: string;
    technicianNotes?: string;
    ipAddress: string;
  }) {
    // 1. Verify machine exists and belongs to tenant
    const machine = await prisma.machine.findFirst({
      where: {
        id: params.machineId,
        ...(params.tenantId ? { tenantId: params.tenantId } : {}),
        deletedAt: null,
      },
    });

    if (!machine) {
      throw new Error('Machine not found or does not belong to your organization.');
    }

    // 2. Persist audio file to disk
    const timestamp = Date.now();
    const safeFileName = `${machine.id}_${timestamp}_${params.fileName.replace(/[^a-zA-Z0-9._-]/g, '')}`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);
    fs.writeFileSync(filePath, params.fileBuffer);
    const audioUrl = `/uploads/diagnostics/${safeFileName}`;

    // 3. Forward to internal FastAPI microservice
    const formData = new FormData();
    const blob = new Blob([params.fileBuffer], { type: 'audio/wav' });
    formData.append('file', blob, safeFileName);

    let aiResponseJson: any;
    try {
      const aiResponse = await fetch(`${ENV.AI_ENGINE_URL}/internal/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        throw new Error(`AI Engine error (${aiResponse.status}): ${errorText}`);
      }

      aiResponseJson = await aiResponse.json();
    } catch (err: any) {
      throw new Error(`Failed to communicate with AI inference engine: ${err.message}`);
    }

    const { prediction, telemetry } = aiResponseJson;
    const isAnomaly = Boolean(prediction.isAnomaly);
    const confidenceScore = Number(prediction.confidenceScore);

    // 4. Save DiagnosticRecord in PostgreSQL
    const diagnostic = await prisma.diagnosticRecord.create({
      data: {
        machineId: machine.id,
        technicianId: params.technicianId,
        audioUrl,
        isAnomaly,
        confidenceScore,
        classProbabilities: prediction.probabilities,
        frequencyData: telemetry,
        technicianNotes: params.technicianNotes || null,
      },
      include: {
        machine: true,
        technician: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    // 5. Automated Machine State Elevation & Ticket Generation
    let createdTicket = null;
    if (isAnomaly) {
      const newStatus = confidenceScore >= 0.85 ? MachineStatus.CRITICAL : MachineStatus.WARNING;
      const priority = confidenceScore >= 0.85 ? TicketPriority.CRITICAL : TicketPriority.HIGH;

      // Update machine status
      await prisma.machine.update({
        where: { id: machine.id },
        data: { status: newStatus },
      });

      // Auto-generate Maintenance Work Order
      createdTicket = await prisma.maintenanceTicket.create({
        data: {
          diagnosticId: diagnostic.id,
          status: TicketStatus.OPEN,
          priority,
          resolutionNotes: `Auto-generated ticket: Acoustic anomaly detected with ${(confidenceScore * 100).toFixed(1)}% confidence. RMS Energy: ${telemetry.rmsEnergyDb} dB, Centroid: ${telemetry.spectralCentroidHz} Hz.`,
        },
      });
    }

    // 6. Record Tamper-Proof Audit Log
    await AuditService.record({
      actorId: params.technicianId,
      tenantId: machine.tenantId,
      action: 'DIAGNOSTIC_EXECUTED',
      resource: `Machine:${machine.id}`,
      ipAddress: params.ipAddress,
      metadata: {
        diagnosticId: diagnostic.id,
        isAnomaly,
        confidenceScore,
        machineType: machine.machineType,
        ticketId: createdTicket?.id || null,
        latencyMs: prediction.inferenceLatencyMs,
      },
    });

    return {
      diagnostic,
      prediction,
      telemetry,
      ticket: createdTicket,
    };
  }

  static async listDiagnostics(options: {
    tenantId?: string | null;
    machineId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.machineId) {
      where.machineId = options.machineId;
    }
    if (options.tenantId) {
      where.machine = { tenantId: options.tenantId };
    }

    const [total, items] = await Promise.all([
      prisma.diagnosticRecord.count({ where }),
      prisma.diagnosticRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          machine: {
            select: { id: true, name: true, machineType: true, serialNumber: true, location: true, status: true },
          },
          technician: {
            select: { id: true, fullName: true, email: true },
          },
          maintenanceTicket: true,
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

  static async getById(id: string, tenantId?: string | null) {
    const where: any = { id };
    if (tenantId) {
      where.machine = { tenantId };
    }

    return prisma.diagnosticRecord.findFirst({
      where,
      include: {
        machine: true,
        technician: { select: { id: true, fullName: true, email: true } },
        maintenanceTicket: {
          include: {
            assignedTo: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
  }
}
