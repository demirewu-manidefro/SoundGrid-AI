import { PrismaClient, UserRole, TenantTier, MachineType, MachineStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SoundGrid Sentinel enterprise database...');

  // Common password hash for demo accounts: "Password123!"
  const passwordHash = await argon2.hash('Password123!', {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,
    timeCost: 3,
    parallelism: 1,
  });

  // 1. Platform Super Admin (Tenant-less global owner)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@soundgrid.ai' },
    update: { passwordHash },
    create: {
      email: 'superadmin@soundgrid.ai',
      fullName: 'Dr. Evelyn Vance (Platform Super Admin)',
      role: UserRole.SUPER_ADMIN,
      passwordHash,
      isActive: true,
    },
  });
  console.log('✅ Created Super Admin:', superAdmin.email);

  // 2. Tenant 1: Apex Power Generation
  const tenantApex = await prisma.tenant.upsert({
    where: { slug: 'apex-power' },
    update: {},
    create: {
      name: 'Apex Power Generation',
      slug: 'apex-power',
      tier: TenantTier.ENTERPRISE,
      isActive: true,
    },
  });
  console.log('✅ Created Tenant:', tenantApex.name);

  // 3. Apex Power Users across tiers
  const apexAdmin = await prisma.user.upsert({
    where: { email: 'admin@apexpower.com' },
    update: { passwordHash, tenantId: tenantApex.id },
    create: {
      email: 'admin@apexpower.com',
      fullName: 'Marcus Sterling (Plant Owner)',
      role: UserRole.ENTERPRISE_ADMIN,
      passwordHash,
      tenantId: tenantApex.id,
      isActive: true,
    },
  });

  const apexTech = await prisma.user.upsert({
    where: { email: 'tech@apexpower.com' },
    update: { passwordHash, tenantId: tenantApex.id },
    create: {
      email: 'tech@apexpower.com',
      fullName: 'Jordan Diaz (Field Acoustic Technician)',
      role: UserRole.TECHNICIAN,
      passwordHash,
      tenantId: tenantApex.id,
      isActive: true,
    },
  });
  console.log('✅ Seeded Apex Power 3-tier user roster (Admin & Technician)');

  // 4. Tenant 2: Titan Industrial Dynamics (to verify organizational isolation)
  const tenantTitan = await prisma.tenant.upsert({
    where: { slug: 'titan-industrial' },
    update: {},
    create: {
      name: 'Titan Industrial Dynamics',
      slug: 'titan-industrial',
      tier: TenantTier.PROFESSIONAL,
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@titanindustrial.com' },
    update: { passwordHash, tenantId: tenantTitan.id },
    create: {
      email: 'admin@titanindustrial.com',
      fullName: 'Vikram Patel (Plant Director)',
      role: UserRole.ENTERPRISE_ADMIN,
      passwordHash,
      tenantId: tenantTitan.id,
      isActive: true,
    },
  });
  console.log('✅ Seeded Titan Industrial tenant & admin');

  // 5. Seed Industrial Machines for Apex Power
  const machines = [
    {
      name: 'Main Substation Step-Up Transformer',
      machineType: MachineType.TRANSFORMER,
      serialNumber: 'TR-750-ALPHA',
      location: 'Substation Yard 4B',
      status: MachineStatus.OPERATIONAL,
    },
    {
      name: 'Primary Coolant Circulation Pump',
      machineType: MachineType.PUMP,
      serialNumber: 'PM-920-BETA',
      location: 'Reactor Core Bay 2',
      status: MachineStatus.WARNING,
    },
    {
      name: 'Heavy Rotor Induction Motor',
      machineType: MachineType.MOTOR,
      serialNumber: 'MT-404-GAMMA',
      location: 'Drive Train Building A',
      status: MachineStatus.OPERATIONAL,
    },
    {
      name: 'High-Volume Flue Exhaust Fan',
      machineType: MachineType.FAN,
      serialNumber: 'FN-108-DELTA',
      location: 'Ventilation Shaft 3',
      status: MachineStatus.CRITICAL,
    },
  ];

  for (const m of machines) {
    await prisma.machine.upsert({
      where: { serialNumber: m.serialNumber },
      update: {},
      create: {
        ...m,
        tenantId: tenantApex.id,
      },
    });
  }
  console.log(`✅ Seeded ${machines.length} industrial machines for Apex Power`);

  // 6. Append Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: superAdmin.id,
        action: 'TENANT_PROVISIONED',
        resource: 'Tenant:apex-power',
        ipAddress: '127.0.0.1',
        metadata: { tier: 'ENTERPRISE', plan: 'Unlimited Edge Telemetry' },
      },
      {
        actorId: apexAdmin.id,
        tenantId: tenantApex.id,
        action: 'USER_CREATED',
        resource: 'User:tech@apexpower.com',
        ipAddress: '127.0.0.1',
        metadata: { role: 'TECHNICIAN' },
      },
    ],
  });
  console.log('✅ Appended initial security audit log entries');
  console.log('🎉 Seed complete! All demo accounts have password: Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
