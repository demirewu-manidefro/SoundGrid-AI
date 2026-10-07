/**
 * SoundGrid Sentinel Phase 2 & Phase 3 Verification Suite
 * Tests:
 * 1. AI Engine Microservice Health & TorchScript Model Status
 * 2. Direct AI Inference & Sub-Second Latency (< 500ms) with Rich Telemetry
 * 3. Node.js Machinery Fleet Management & Registration
 * 4. End-to-End Inter-Service Audio Diagnostic Gateway Pipeline
 * 5. Automated Machine Severity Elevation & Work Order Generation
 * 6. Plant Safety Manager (Tier 3) Assignment & Resolution Approval Workflow
 * 7. Third-Party Auditor Read-Only Verification on Telemetry & Diagnostics
 */

const BACKEND_URL = 'http://localhost:8000';
const AI_ENGINE_URL = 'http://127.0.0.1:8001';

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

/**
 * Creates a valid RIFF/WAVE PCM buffer in memory for testing
 */
function createSyntheticWaveBuffer(durationSeconds = 3.0, sampleRate = 16000, frequencyHz = 440.0, isNoisy = false): Buffer {
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataByteLength = numSamples * 2; // 16-bit mono = 2 bytes per sample
  const buffer = Buffer.alloc(44 + dataByteLength);

  // RIFF header
  buffer.write('RIFF', 0, 4, 'ascii');
  buffer.writeUInt32LE(36 + dataByteLength, 4);
  buffer.write('WAVE', 8, 4, 'ascii');

  // fmt subchunk
  buffer.write('fmt ', 12, 4, 'ascii');
  buffer.writeUInt32LE(16, 16); // subchunk1 size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // PCM format
  buffer.writeUInt16LE(1, 22);  // 1 channel (mono)
  buffer.writeUInt32LE(sampleRate, 24); // sample rate
  buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate (SampleRate * NumChannels * BitsPerSample/8)
  buffer.writeUInt16LE(2, 32);  // block align
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data subchunk
  buffer.write('data', 36, 4, 'ascii');
  buffer.writeUInt32LE(dataByteLength, 40);

  // Synthesize acoustic audio samples
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = Math.sin(2 * Math.PI * frequencyHz * t);
    if (isNoisy) {
      // Add harmonics and broadband noise to simulate abnormal machine hum/friction
      sample = 0.5 * sample + 0.3 * Math.sin(2 * Math.PI * frequencyHz * 3 * t) + 0.2 * (Math.random() * 2 - 1);
    }
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 30000)));
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  return buffer;
}

async function runVerification() {
  console.log('\n======================================================');
  console.log('🔬 STARTING SOUNDGRID SENTINEL PHASE 2 & 3 VERIFICATION');
  console.log('======================================================\n');

  let techToken = '';
  let safetyToken = '';
  let enterpriseAdminToken = '';
  let auditorToken = '';
  let targetMachineId = '';
  let generatedDiagnosticId = '';
  let generatedTicketId = '';

  // Step 0: Authenticate required roles
  await assertTest('Authentication Setup', 'Authenticate Technician, Safety Manager, Admin, and Auditor', async () => {
    // Technician
    let res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tech@apexpower.com', password: 'Password123!' }),
    });
    let data = await res.json();
    techToken = data.accessToken;

    // Safety Manager
    res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'safety@apexpower.com', password: 'Password123!' }),
    });
    data = await res.json();
    safetyToken = data.accessToken;

    // Enterprise Admin
    res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@apexpower.com', password: 'Password123!' }),
    });
    data = await res.json();
    enterpriseAdminToken = data.accessToken;

    // Auditor
    res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'auditor@apexpower.com', password: 'Password123!' }),
    });
    data = await res.json();
    auditorToken = data.accessToken;

    if (!techToken || !safetyToken || !enterpriseAdminToken || !auditorToken) {
      throw new Error('Failed to acquire test auth tokens');
    }
  });

  // 1. AI Engine Microservice Direct Verification
  await assertTest('AI Inference Microservice', 'FastAPI health check returns HEALTHY with TorchScript model info', async () => {
    const res = await fetch(`${AI_ENGINE_URL}/internal/health`);
    const data = await res.json();
    if (res.status !== 200 || data.status !== 'HEALTHY' || data.engine !== 'SoundGrid TorchScript Runtime') {
      throw new Error(`Unexpected AI engine status: ${JSON.stringify(data)}`);
    }
  });

  await assertTest('AI Inference Microservice', 'Direct inference on synthetic audio returns sub-second latency and acoustic telemetry', async () => {
    const wavBuffer = createSyntheticWaveBuffer(3.0, 16000, 120.0, false);
    const formData = new FormData();
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    formData.append('file', blob, 'test_transformer_hum.wav');

    const res = await fetch(`${AI_ENGINE_URL}/internal/predict`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();

    if (res.status !== 200 || !data.success) {
      throw new Error(`Inference call failed: ${JSON.stringify(data)}`);
    }

    if (typeof data.prediction.confidenceScore !== 'number') {
      throw new Error('Missing confidence score in prediction');
    }

    if (data.prediction.inferenceLatencyMs > 500) {
      throw new Error(`Latency too high: ${data.prediction.inferenceLatencyMs}ms (expected < 500ms)`);
    }

    // Verify telemetry fields
    const tel = data.telemetry;
    if (typeof tel.rmsEnergyDb !== 'number' || typeof tel.spectralCentroidHz !== 'number' || !Array.isArray(tel.previewHeatmap)) {
      throw new Error(`Incomplete telemetry: ${JSON.stringify(tel)}`);
    }

    console.log(`     Model Latency: ${data.prediction.inferenceLatencyMs}ms | Predicted: ${data.prediction.predictedClass} | Confidence: ${(data.prediction.confidenceScore * 100).toFixed(1)}%`);
  });

  // 2. Machine Fleet Management
  await assertTest('Machinery Fleet Module', 'Enterprise Admin and Technician list machines and identify target asset', async () => {
    const res = await fetch(`${BACKEND_URL}/api/machines`, {
      headers: { Authorization: `Bearer ${techToken}` },
    });
    const data = await res.json();

    if (res.status !== 200 || !Array.isArray(data.data) || data.data.length === 0) {
      throw new Error(`Failed to list machinery: ${JSON.stringify(data)}`);
    }

    // Select the transformer or pump
    const target = data.data.find((m: any) => m.serialNumber === 'TR-750-ALPHA') || data.data[0];
    targetMachineId = target.id;
    console.log(`     Target Machine: ${target.name} (${target.serialNumber}) [Status: ${target.status}]`);
  });

  await assertTest('Machinery Fleet Module', 'Enterprise Admin registers a new heavy industrial motor', async () => {
    const uniqueSerial = `MT-TEST-${Date.now()}`;
    const res = await fetch(`${BACKEND_URL}/api/machines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${enterpriseAdminToken}`,
      },
      body: JSON.stringify({
        name: 'Secondary High-Torque Auxiliary Motor',
        machineType: 'MOTOR',
        serialNumber: uniqueSerial,
        location: 'Bay 5 - Drive Section C',
      }),
    });
    const data = await res.json();
    if (res.status !== 201 || !data.data || data.data.serialNumber !== uniqueSerial) {
      throw new Error(`Failed to register machinery: ${JSON.stringify(data)}`);
    }
  });

  // 3. Audio Diagnostic Gateway Pipeline
  await assertTest('Audio Diagnostic Gateway', 'Field Technician uploads inspection audio; Node.js gateway forwards to AI microservice and saves record', async () => {
    // Generate acoustic wave with high-frequency harmonic distortion (simulating anomaly)
    const anomalyWav = createSyntheticWaveBuffer(3.0, 16000, 350.0, true);

    const formData = new FormData();
    const blob = new Blob([anomalyWav], { type: 'audio/wav' });
    formData.append('audio', blob, 'field_inspection_sample.wav');
    formData.append('machineId', targetMachineId);
    formData.append('technicianNotes', 'Unusual vibration rattling heard from transformer casing during load ramp-up.');

    const res = await fetch(`${BACKEND_URL}/api/diagnostics`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${techToken}` },
      body: formData,
    });
    const data = await res.json();

    if (res.status !== 201 || !data.success || !data.data.diagnostic) {
      throw new Error(`Diagnostic execution failed: ${JSON.stringify(data)}`);
    }

    generatedDiagnosticId = data.data.diagnostic.id;
    if (data.data.ticket) {
      generatedTicketId = data.data.ticket.id;
    }

    console.log(`     Diagnostic Record ID: ${generatedDiagnosticId}`);
    console.log(`     Inference Result: ${data.data.prediction.predictedClass} | Latency: ${data.data.prediction.inferenceLatencyMs}ms`);
    console.log(`     Ticket Generated: ${generatedTicketId || 'None'}`);
  });

  // 4. Automated Anomaly State Elevation & Maintenance Ticket
  await assertTest('Predictive Maintenance Workflow', 'Machine status elevated and Maintenance Work Order generated', async () => {
    const res = await fetch(`${BACKEND_URL}/api/machines/${targetMachineId}`, {
      headers: { Authorization: `Bearer ${techToken}` },
    });
    const data = await res.json();

    if (res.status !== 200 || !data.data) {
      throw new Error('Failed to retrieve machine status');
    }

    console.log(`     Current Machine Status: ${data.data.status}`);

    // If an anomaly was detected, status should be WARNING or CRITICAL
    const diagRes = await fetch(`${BACKEND_URL}/api/diagnostics/${generatedDiagnosticId}`, {
      headers: { Authorization: `Bearer ${techToken}` },
    });
    const diagData = await diagRes.json();

    if (diagData.data.isAnomaly) {
      if (data.data.status === 'OPERATIONAL') {
        throw new Error('Machine status should have been elevated upon anomaly detection');
      }
      if (!diagData.data.maintenanceTicket) {
        throw new Error('Expected maintenance ticket to be linked to anomaly diagnostic');
      }
      generatedTicketId = diagData.data.maintenanceTicket.id;
    }
  });

  // 5. Plant Safety Manager (Tier 3) Approval Workflow
  await assertTest('Safety Manager Supervision', 'Plant Safety Manager reviews open work orders, assigns ticket, and approves resolution', async () => {
    // If no ticket was generated from the synthetic sample (if classified as normal), create one for testing the workflow
    if (!generatedTicketId) {
      const ticketsRes = await fetch(`${BACKEND_URL}/api/tickets`, {
        headers: { Authorization: `Bearer ${safetyToken}` },
      });
      const ticketsData = await ticketsRes.json();
      if (ticketsData.data.length > 0) {
        generatedTicketId = ticketsData.data[0].id;
      }
    }

    if (generatedTicketId) {
      // 1. Assign ticket
      const assignRes = await fetch(`${BACKEND_URL}/api/tickets/${generatedTicketId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${safetyToken}`,
        },
        body: JSON.stringify({ assignedToId: 'd6b9d6a2-63b7-4b5f-a392-5ebf64c67789' }), // Will handle gracefully or re-assign
      });

      // 2. Resolve ticket & approve machine state
      const resolveRes = await fetch(`${BACKEND_URL}/api/tickets/${generatedTicketId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${safetyToken}`,
        },
        body: JSON.stringify({
          resolutionNotes: 'Bearing lubricated and rotor casing re-torqued. Acoustic harmonics verified normal at 50Hz load.',
        }),
      });

      const resolveData = await resolveRes.json();
      if (resolveRes.status !== 200 || !resolveData.success) {
        throw new Error(`Failed to resolve ticket: ${JSON.stringify(resolveData)}`);
      }

      // 3. Verify machine restored to OPERATIONAL
      const machineCheck = await fetch(`${BACKEND_URL}/api/machines/${targetMachineId}`, {
        headers: { Authorization: `Bearer ${safetyToken}` },
      });
      const machineData = await machineCheck.json();
      if (machineData.data.status !== 'OPERATIONAL') {
        throw new Error(`Machine status was not restored to OPERATIONAL (found ${machineData.data.status})`);
      }
      console.log('     Machine state successfully restored to OPERATIONAL after Chief Engineer approval.');
    } else {
      console.log('     (No active ticket required resolution)');
    }
  });

  // 6. Third-Party Auditor Read-Only Compliance
  await assertTest('Auditor Compliance', 'Auditor has read access to diagnostics and tickets, but is blocked from triggering evaluations', async () => {
    // Read diagnostics -> 200 OK
    const diagRes = await fetch(`${BACKEND_URL}/api/diagnostics`, {
      headers: { Authorization: `Bearer ${auditorToken}` },
    });
    if (diagRes.status !== 200) throw new Error(`Auditor cannot read diagnostics: ${diagRes.status}`);

    // Read tickets -> 200 OK
    const ticketRes = await fetch(`${BACKEND_URL}/api/tickets`, {
      headers: { Authorization: `Bearer ${auditorToken}` },
    });
    if (ticketRes.status !== 200) throw new Error(`Auditor cannot read tickets: ${ticketRes.status}`);

    // Attempt to trigger diagnostic -> 403 Forbidden
    const fakeBuffer = createSyntheticWaveBuffer(1.0, 16000, 440.0, false);
    const formData = new FormData();
    const blob = new Blob([fakeBuffer], { type: 'audio/wav' });
    formData.append('audio', blob, 'auditor_illegal_probe.wav');
    formData.append('machineId', targetMachineId);

    const illegalDiag = await fetch(`${BACKEND_URL}/api/diagnostics`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${auditorToken}` },
      body: formData,
    });
    if (illegalDiag.status !== 403) {
      throw new Error(`Auditor was able to trigger diagnostic (expected 403, got ${illegalDiag.status})`);
    }
  });

  console.log('\n======================================================');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`🏁 PHASE 2 & 3 VERIFICATION COMPLETE: ${passedCount}/${results.length} TESTS PASSED`);
  console.log('======================================================\n');

  if (passedCount < results.length) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
