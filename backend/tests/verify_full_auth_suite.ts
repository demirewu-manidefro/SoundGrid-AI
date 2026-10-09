import { prisma } from '../src/db/prisma';

const BASE_URL = 'http://localhost:8000';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function assertTest(category: string, name: string, fn: () => Promise<void>) {
  const start = performance.now();
  try {
    await fn();
    results.push({ category, name, passed: true, durationMs: Math.round(performance.now() - start) });
    console.log(`  ✅ [PASS] (${Math.round(performance.now() - start)}ms) ${name}`);
  } catch (err: any) {
    results.push({ category, name, passed: false, error: err.message, durationMs: Math.round(performance.now() - start) });
    console.error(`  ❌ [FAIL] ${name} -> ${err.message}`);
  }
}

async function runFullAuthVerification() {
  console.log('\n======================================================');
  console.log('🛡️ SOUNDGRID SENTINEL: COMPREHENSIVE AUTH SYSTEM AUDIT');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // 1. Health & Server Status
  // -------------------------------------------------------------------------
  console.log('📡 1. Gateway & Connectivity:');
  await assertTest('Connectivity', 'Health check returns HEALTHY and PostgreSQL is CONNECTED', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    if (res.status !== 200 || data.database !== 'CONNECTED') {
      throw new Error(`Health check returned status ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // -------------------------------------------------------------------------
  // 2. Argon2id Password Authentication Across All 3 Ranks
  // -------------------------------------------------------------------------
  console.log('\n🔐 2. Argon2id Multi-Tier Role Hierarchy (3 Roles):');
  const rolesToTest = [
    { email: 'superadmin@soundgrid.ai', expectedRole: 'SUPER_ADMIN', label: 'Tier 1 Super Admin' },
    { email: 'admin@apexpower.com', expectedRole: 'ENTERPRISE_ADMIN', label: 'Tier 2 Plant Admin' },
    { email: 'tech@apexpower.com', expectedRole: 'TECHNICIAN', label: 'Tier 3 Field Technician' },
  ];

  let technicianAccessToken = '';
  let technicianRefreshToken = '';

  for (const item of rolesToTest) {
    await assertTest('Argon2id', `${item.label} successfully authenticates and receives tokens`, async () => {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: item.email, password: 'Password123!' }),
      });
      const data = await res.json();
      if (res.status !== 200 || !data.accessToken || data.user.role !== item.expectedRole) {
        throw new Error(`Authentication failed for ${item.email}: ${JSON.stringify(data)}`);
      }
      if (item.expectedRole === 'TECHNICIAN') {
        technicianAccessToken = data.accessToken;
        technicianRefreshToken = data.refreshToken;
      }
    });
  }

  // -------------------------------------------------------------------------
  // 3. Negative Authentication Paths
  // -------------------------------------------------------------------------
  console.log('\n🚫 3. Negative Auth & Defense-in-Depth:');
  await assertTest('Negative Auth', 'Rejects incorrect password with 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@apexpower.com', password: 'WrongPassword999!' }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected status 401, got ${res.status}`);
    }
  });

  await assertTest('Negative Auth', 'Rejects non-existent email with 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ghost-user@nonexistent.com', password: 'Password123!' }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected status 401, got ${res.status}`);
    }
  });

  await assertTest('Negative Auth', 'Rejects malformed login payload with 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
    });
    if (res.status !== 400) {
      throw new Error(`Expected status 400, got ${res.status}`);
    }
  });

  // -------------------------------------------------------------------------
  // 4. Dual-Token Architecture & Rotation Security
  // -------------------------------------------------------------------------
  console.log('\n🔄 4. Dual-Token Session & Refresh Token Rotation:');
  await assertTest('Session Token', 'Access token retrieves authenticated user context via /api/auth/me', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${technicianAccessToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || !data.user || data.user.email !== 'tech@apexpower.com') {
      throw new Error(`User retrieval failed: ${JSON.stringify(data)}`);
    }
  });

  let rotatedAccessToken = '';
  let rotatedRefreshToken = '';
  await assertTest('Token Rotation', 'Refresh token rotation invalidates old token and issues new pair', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: technicianRefreshToken }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.accessToken || !data.refreshToken) {
      throw new Error(`Rotation failed: ${JSON.stringify(data)}`);
    }
    rotatedAccessToken = data.accessToken;
    rotatedRefreshToken = data.refreshToken;
  });

  await assertTest('Security Guard', 'Detects replay attack: reusing old revoked refresh token fails with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: technicianRefreshToken }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401 on revoked token reuse, got ${res.status}`);
    }
  });

  // -------------------------------------------------------------------------
  // 5. Google OAuth 2.0 SSO Lifecycle
  // -------------------------------------------------------------------------
  console.log('\n🌐 5. Google OAuth 2.0 Single Sign-On (SSO):');
  const googleEmail = `google-operator-${Date.now()}@apexpower.com`;
  let googleUserId = '';
  let googleAccessToken = '';

  await assertTest('Google SSO', 'Rejects missing Google idToken with 400 Bad Request', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (res.status !== 400) {
      throw new Error(`Expected 400, got ${res.status}`);
    }
  });

  await assertTest('Google SSO', 'Rejects forged/untrusted Google idToken with 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'forged.google.token.attack' }),
    });
    if (res.status !== 401) {
      throw new Error(`Expected 401, got ${res.status}`);
    }
  });

  await assertTest('Google SSO', 'Auto-provisions new user under Apex Power tenant with TECHNICIAN role', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: `mock-google-token:${googleEmail}` }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.accessToken || data.user.email !== googleEmail) {
      throw new Error(`SSO authentication failed: ${JSON.stringify(data)}`);
    }
    if (data.user.role !== 'TECHNICIAN' || data.user.tenant?.slug !== 'apex-power') {
      throw new Error(`User provisioning mismatch: role=${data.user.role}, tenant=${data.user.tenant?.slug}`);
    }
    googleUserId = data.user.id;
    googleAccessToken = data.accessToken;
  });

  await assertTest('Google SSO', 'Introspects Google user session via /api/auth/me', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || data.user.id !== googleUserId) {
      throw new Error(`Failed to verify Google user: ${JSON.stringify(data)}`);
    }
  });

  await assertTest('Google SSO', 'Re-login updates lastLoginAt without duplicate user creation', async () => {
    const before = await prisma.user.findUnique({ where: { id: googleUserId } });
    await new Promise((r) => setTimeout(r, 50));
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: `mock-google-token:${googleEmail}` }),
    });
    const data = await res.json();
    if (res.status !== 200 || data.user.id !== googleUserId) {
      throw new Error('User identity corrupted on re-login');
    }
    const after = await prisma.user.findUnique({ where: { id: googleUserId } });
    if (!after?.lastLoginAt || !before?.lastLoginAt || after.lastLoginAt.getTime() <= before.lastLoginAt.getTime()) {
      throw new Error('lastLoginAt was not updated on re-login');
    }
  });

  // -------------------------------------------------------------------------
  // 6. Logout & Session Termination
  // -------------------------------------------------------------------------
  console.log('\n🚪 6. Logout & Token Invalidation:');
  await assertTest('Logout', 'User logout successfully revokes refresh token session', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rotatedAccessToken}`,
      },
      body: JSON.stringify({ refreshToken: rotatedRefreshToken }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success) {
      throw new Error(`Logout failed: ${JSON.stringify(data)}`);
    }

    // Attempting to refresh with logged-out token must fail
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rotatedRefreshToken }),
    });
    if (refreshRes.status !== 401) {
      throw new Error(`Expected 401 after logout, got ${refreshRes.status}`);
    }
  });

  // -------------------------------------------------------------------------
  // 7. Audit Log Verification
  // -------------------------------------------------------------------------
  console.log('\n📜 7. Immutable PostgreSQL Audit Log:');
  await assertTest('Audit Logs', 'Verifies immutable audit trail records all authentication events', async () => {
    const requiredActions = [
      'AUTH_LOGIN_SUCCESS',
      'AUTH_LOGIN_FAILED',
      'AUTH_TOKEN_ROTATED',
      'AUTH_GOOGLE_SSO_SUCCESS',
      'AUTH_LOGOUT',
    ];

    for (const action of requiredActions) {
      const entry = await prisma.auditLog.findFirst({
        where: { action },
      });
      if (!entry) {
        throw new Error(`Missing expected audit log entry for: ${action}`);
      }
    }
    console.log(`     Recorded Audit Actions Checked: [${requiredActions.join(', ')}]`);
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log('\n======================================================');
  console.log(`🏁 AUTH AUDIT COMPLETE: ${passed}/${total} TESTS PASSED (${failed} failures)`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runFullAuthVerification()
  .catch((e) => {
    console.error('Fatal audit failure:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
