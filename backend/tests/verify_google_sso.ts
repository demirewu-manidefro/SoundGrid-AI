import { prisma } from '../src/db/prisma';

const BASE_URL = 'http://localhost:8000';

async function runGoogleSSOVerification() {
  console.log('\n======================================================');
  console.log('🔬 STARTING GOOGLE OAUTH 2.0 SSO VERIFICATION');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name} -> ${err.message}`);
    }
  }

  const testEmail = `operator-${Date.now()}@apexpower.com`;

  // 1. Missing token
  await test('Reject request with missing idToken (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.status !== 400) {
      throw new Error(`Expected status 400, received ${res.status}`);
    }
  });

  // 2. Invalid Google token
  await test('Reject invalid/forged Google idToken (401 Unauthorized)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'malicious-forged-token-xyz' }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected status 401, received ${res.status}`);
    }
  });

  // 3. New user auto-provisioning
  let newUserId = '';
  let accessToken = '';
  await test('Auto-provision new user with role TECHNICIAN under Apex Power tenant', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: `mock-google-token:${testEmail}` }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success || !data.accessToken) {
      throw new Error(`Failed to authenticate: ${JSON.stringify(data)}`);
    }

    if (data.user.role !== 'TECHNICIAN') {
      throw new Error(`Expected role TECHNICIAN, got ${data.user.role}`);
    }

    if (data.user.tenant?.slug !== 'apex-power') {
      throw new Error(`Expected tenant slug apex-power, got ${data.user.tenant?.slug}`);
    }

    newUserId = data.user.id;
    accessToken = data.accessToken;
  });

  // 4. Authenticated /me endpoint check
  await test('Verify issued access token retrieves provisioned profile via /api/auth/me', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || data.user.id !== newUserId) {
      throw new Error(`User mismatch on /me: ${JSON.stringify(data)}`);
    }
  });

  // 5. Returning user re-login
  await test('Returning user login updates lastLoginAt without re-creating record', async () => {
    const beforeUser = await prisma.user.findUnique({ where: { id: newUserId } });
    await new Promise((r) => setTimeout(r, 100));

    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: `mock-google-token:${testEmail}` }),
    });
    const data = await res.json();
    if (res.status !== 200 || data.user.id !== newUserId) {
      throw new Error(`Expected same user ID ${newUserId}, got ${data.user?.id}`);
    }

    const afterUser = await prisma.user.findUnique({ where: { id: newUserId } });
    if (!afterUser?.lastLoginAt || !beforeUser?.lastLoginAt) {
      throw new Error('Missing lastLoginAt timestamp');
    }
    if (afterUser.lastLoginAt.getTime() <= beforeUser.lastLoginAt.getTime()) {
      throw new Error('lastLoginAt was not updated on re-login');
    }
  });

  // 6. Audit Log validation
  await test('Verify AUTH_GOOGLE_SSO_SUCCESS is recorded in immutable audit log', async () => {
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        actorId: newUserId,
        action: 'AUTH_GOOGLE_SSO_SUCCESS',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!auditRecord) {
      throw new Error('No AUTH_GOOGLE_SSO_SUCCESS audit log found for user');
    }
  });

  console.log('\n======================================================');
  console.log(`🏁 GOOGLE SSO VERIFICATION COMPLETE: ${passed}/${total} TESTS PASSED`);
  console.log('======================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runGoogleSSOVerification()
  .catch((e) => {
    console.error('Fatal error during test:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
