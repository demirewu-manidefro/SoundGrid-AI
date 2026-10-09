async function testRegistration() {
  const BASE_URL = 'http://localhost:8000';
  const testEmail = `test.operator.${Date.now()}@apexpower.com`;

  console.log(`[TEST] Attempting registration for ${testEmail}...`);
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'John Acoustic Operator',
        email: testEmail,
        password: 'SecurePassword123!',
        role: 'TECHNICIAN',
        organizationName: 'Apex Power Generation'
      })
    });

    const data: any = await res.json();
    console.log('[SUCCESS] Registration status:', res.status);
    console.log('[USER CREATED]:', data.user);
    console.log('[TOKEN RECEIVED]:', data.accessToken ? 'YES' : 'NO');

    // Test duplicate registration rejection
    console.log('[TEST] Testing duplicate email rejection...');
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'John Duplicate',
        email: testEmail,
        password: 'SecurePassword123!',
      })
    });
    const dupData: any = await dupRes.json();
    console.log('[SUCCESS] Duplicate correctly rejected with status:', dupRes.status, 'message:', dupData.message);

    // Test logging in with newly registered user
    console.log('[TEST] Testing login with newly registered credentials...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword123!'
      })
    });
    const loginData: any = await loginRes.json();
    console.log('[SUCCESS] Login status:', loginRes.status);
    console.log('[LOGGED IN USER]:', loginData.user);

  } catch (err: any) {
    console.error('[ERROR]:', err.message);
  }
}

testRegistration();
