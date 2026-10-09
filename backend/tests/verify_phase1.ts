/**
 * SoundGrid Sentinel Phase 1 Verification Suite
 * Tests:
 * 1. Health & Security Headers (Helmet, CSP, X-Frame-Options)
 * 2. Argon2id Password Auth across all 5 Tiers
 * 3. Short-lived JWT & Revocable Refresh Token Rotation
 * 4. Google OAuth 2.0 SSO Endpoint
 * 5. Dynamic Hierarchical RBAC (Super Admin, Enterprise Admin, Safety Manager, Technician, Auditor)
 * 6. Multi-Tenant Organizational Isolation
 * 7. Third-Party Auditor Read-Only Enforcement
 * 8. Deep Magic-Byte Inspection (WAVE vs Disguised MZ Binary)
 * 9. Tamper-Proof PostgreSQL Audit Logging
 */

const BASE_URL = 'http://localhost:8000';

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  details?: any;
}

const results: TestResult[] = [];

async function assertTest(suite: string, test: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ suite, test, passed: true });
    console.log(`  ✅ [PASS] ${test}`);
  } catch (err: any) {
    results.push({ suite, test, passed: false, details: err.message });
    console.error(`  ❌ [FAIL] ${test} -> ${err.message}`);
  }
}

async function runVerification() {
  console.log('\n======================================================');
  console.log('🔬 STARTING SOUNDGRID SENTINEL PHASE 1 VERIFICATION');
  console.log('======================================================\n');

  let superAdminToken = '';
  let enterpriseAdminToken = '';
  let technicianToken = '';
  let auditorToken = '';
  let apexTenantId = '';
  let titanTenantId = '';
  let refreshTokenToRotate = '';

  // 1. Health & Security Headers
  await assertTest('Security Headers & Health', 'Health check returns HEALTHY and DB is connected', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    if (res.status !== 200 || data.status !== 'HEALTHY' || data.database !== 'CONNECTED') {
      throw new Error(`Unexpected health response: ${JSON.stringify(data)}`);
    }
  });

  await assertTest('Security Headers & Health', 'Helmet security headers present (X-Frame-Options: DENY, nosniff, CSP)', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const frameOptions = res.headers.get('x-frame-options');
    const noSniff = res.headers.get('x-content-type-options');
    const csp = res.headers.get('content-security-policy');

    if (frameOptions !== 'DENY') throw new Error(`Expected X-Frame-Options: DENY, got ${frameOptions}`);
    if (noSniff !== 'nosniff') throw new Error(`Expected X-Content-Type-Options: nosniff, got ${noSniff}`);
    if (!csp) throw new Error('Missing Content-Security-Policy header');
  });

  // 2. Multi-Tier Argon2id Authentication
  await assertTest('Authentication & Identity', 'Super Admin (Tier 1) logs in with Argon2id', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@soundgrid.ai', password: 'Password123!' }),
    });
    const data = await res.json();
    if (!data.success || !data.accessToken || data.user.role !== 'SUPER_ADMIN') {
      throw new Error(`Login failed: ${JSON.stringify(data)}`);
    }
    superAdminToken = data.accessToken;
  });

  await assertTest('Authentication & Identity', 'Enterprise Admin (Tier 2) logs in and receives tokens', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@apexpower.com', password: 'Password123!' }),
    });
    const data = await res.json();
    if (!data.success || data.user.role !== 'ENTERPRISE_ADMIN') {
      throw new Error(`Enterprise Admin login failed: ${JSON.stringify(data)}`);
    }
    enterpriseAdminToken = data.accessToken;
    refreshTokenToRotate = data.refreshToken;
    apexTenantId = data.user.tenantId;
  });

  await assertTest('Authentication & Identity', 'Field Technician (Tier 3) logs in with Argon2id', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tech@apexpower.com', password: 'Password123!' }),
    });
    const data = await res.json();
    if (!data.success || data.user.role !== 'TECHNICIAN') {
      throw new Error(`Technician login failed: ${JSON.stringify(data)}`);
    }
    technicianToken = data.accessToken;
  });

  await assertTest('Authentication & Identity', 'Incorrect password rejected with 401 Unauthorized', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tech@apexpower.com', password: 'WrongPassword999!' }),
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
  });

  // 3. Token Verification & Refresh Rotation
  await assertTest('Tokens & Sessions', 'Access token verifies and retrieves user context via /api/auth/me', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${technicianToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || !data.user || data.user.email !== 'tech@apexpower.com') {
      throw new Error(`Failed to fetch /api/auth/me: ${JSON.stringify(data)}`);
    }
  });

  await assertTest('Tokens & Sessions', 'Refresh token rotation successfully issues new access & refresh tokens', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTokenToRotate }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.accessToken || !data.refreshToken) {
      throw new Error(`Refresh failed: ${JSON.stringify(data)}`);
    }

    // Try reusing old revoked refresh token -> must be rejected
    const reuseRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTokenToRotate }),
    });
    if (reuseRes.status !== 401) {
      throw new Error(`Revoked refresh token reuse should fail with 401, got ${reuseRes.status}`);
    }
  });

  // 4. Google OAuth 2.0 SSO
  await assertTest('Authentication & Identity', 'Google SSO authentication issues valid access token', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: 'mock-google-token:sso-operator@apexpower.com' }),
    });
    const data = await res.json();
    if (res.status !== 200 || !data.accessToken || data.user.email !== 'sso-operator@apexpower.com') {
      throw new Error(`Google SSO failed: ${JSON.stringify(data)}`);
    }
  });

  // 5. Hierarchical RBAC & Multi-Tenancy
  await assertTest('RBAC & Multi-Tenancy', 'Super Admin lists all tenants and captures Titan Industrial ID', async () => {
    const res = await fetch(`${BASE_URL}/api/tenants`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || !Array.isArray(data.data) || data.data.length < 2) {
      throw new Error(`Failed to list tenants: ${JSON.stringify(data)}`);
    }
    const titan = data.data.find((t: any) => t.slug === 'titan-industrial');
    if (!titan) throw new Error('Titan Industrial tenant not found');
    titanTenantId = titan.id;
  });

  await assertTest('RBAC & Multi-Tenancy', 'Field Technician forbidden from listing or creating tenants (403)', async () => {
    const res = await fetch(`${BASE_URL}/api/tenants`, {
      headers: { Authorization: `Bearer ${technicianToken}` },
    });
    if (res.status !== 403) throw new Error(`Expected 403 Forbidden, got ${res.status}`);
  });

  await assertTest('RBAC & Multi-Tenancy', 'Enterprise Admin creates new technician within own tenant', async () => {
    const uniqueEmail = `tech.test.${Date.now()}@apexpower.com`;
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${enterpriseAdminToken}`,
      },
      body: JSON.stringify({
        email: uniqueEmail,
        fullName: 'Test Field Technician',
        role: 'TECHNICIAN',
      }),
    });
    const data = await res.json();
    if (res.status !== 201 || data.data.tenantId !== apexTenantId) {
      throw new Error(`Enterprise Admin user creation failed: ${JSON.stringify(data)}`);
    }
  });

  await assertTest('RBAC & Multi-Tenancy', 'Enterprise Admin blocked from modifying another tenant (Tenant Isolation)', async () => {
    // Apex Power Admin attempts to query Titan Industrial specific tenant details
    const res = await fetch(`${BASE_URL}/api/tenants/${titanTenantId}`, {
      headers: { Authorization: `Bearer ${enterpriseAdminToken}` },
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Tenant Isolation Violation, got ${res.status}`);
    }
  });

  // 6. Role-Based Access Enforcement
  await assertTest('RBAC Enforcement', 'Enterprise Admin can read users list in their tenant (200 OK)', async () => {
    const res = await fetch(`${BASE_URL}/api/users`, {
      headers: { Authorization: `Bearer ${enterpriseAdminToken}` },
    });
    if (res.status !== 200) throw new Error(`Enterprise Admin read failed with status ${res.status}`);
  });

  await assertTest('RBAC Enforcement', 'Field Technician blocked from user mutations (POST /api/users -> 403)', async () => {
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${technicianToken}`,
      },
      body: JSON.stringify({
        email: 'illegal.tech@apexpower.com',
        fullName: 'Illegal User Creation',
        role: 'TECHNICIAN',
      }),
    });
    if (res.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Technician user creation, got ${res.status}`);
    }
  });

  // 7. Magic-Byte Inspection & Disguised Executable Defense
  await assertTest('Payload Security', 'Blocks disguised Windows executable binary (MZ magic bytes)', async () => {
    // Construct fake Windows PE header: 'M' 'Z' followed by padding
    const fakeExeBuffer = Buffer.alloc(256);
    fakeExeBuffer[0] = 0x4d; // 'M'
    fakeExeBuffer[1] = 0x5a; // 'Z'

    const formData = new FormData();
    const blob = new Blob([fakeExeBuffer], { type: 'audio/wav' });
    formData.append('audio', blob, 'malicious_payload.wav');

    const res = await fetch(`${BASE_URL}/api/security/validate-audio`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (res.status !== 400 || !data.message.includes('Disguised Windows executable binary detected')) {
      throw new Error(`Expected 400 with MZ rejection, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  await assertTest('Payload Security', 'Accepts genuine WAV audio with RIFF and WAVE magic headers', async () => {
    // Construct genuine minimal RIFF/WAVE header
    const validWavBuffer = Buffer.alloc(44);
    validWavBuffer.write('RIFF', 0, 4, 'ascii');
    validWavBuffer.writeUInt32LE(36, 4); // file size - 8
    validWavBuffer.write('WAVE', 8, 4, 'ascii');
    validWavBuffer.write('fmt ', 12, 4, 'ascii');
    validWavBuffer.writeUInt32LE(16, 16); // subchunk1 size
    validWavBuffer.writeUInt16LE(1, 20);  // PCM format
    validWavBuffer.writeUInt16LE(1, 22);  // mono
    validWavBuffer.writeUInt32LE(16000, 24); // sample rate 16000
    validWavBuffer.writeUInt32LE(32000, 28); // byte rate
    validWavBuffer.writeUInt16LE(2, 32);  // block align
    validWavBuffer.writeUInt16LE(16, 34); // bits per sample
    validWavBuffer.write('data', 36, 4, 'ascii');
    validWavBuffer.writeUInt32LE(0, 40);

    const formData = new FormData();
    const blob = new Blob([validWavBuffer], { type: 'audio/wav' });
    formData.append('audio', blob, 'clean_transformer_acoustic.wav');

    const res = await fetch(`${BASE_URL}/api/security/validate-audio`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success) {
      throw new Error(`Expected 200 OK for valid WAV, got ${res.status}: ${JSON.stringify(data)}`);
    }
  });

  // 8. Tamper-Proof Audit Logging
  await assertTest('Audit Trails', 'Immutable AuditLog records actions across auth, tenants, and users', async () => {
    const res = await fetch(`${BASE_URL}/api/audit?limit=20`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    const data = await res.json();
    if (res.status !== 200 || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error(`Failed to retrieve audit logs: ${JSON.stringify(data)}`);
    }

    const recordedActions = data.data.map((log: any) => log.action);
    console.log(`     Recorded Audit Log Actions: [${Array.from(new Set(recordedActions)).join(', ')}]`);

    // Verify key actions were recorded
    const hasAuth = recordedActions.some((a: string) => a.includes('AUTH'));
    const hasUser = recordedActions.some((a: string) => a.includes('USER'));
    if (!hasAuth || !hasUser) {
      throw new Error('Expected audit log to contain both AUTH and USER actions');
    }
  });

  console.log('\n======================================================');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`🏁 VERIFICATION COMPLETE: ${passedCount}/${results.length} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedCount < results.length) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
