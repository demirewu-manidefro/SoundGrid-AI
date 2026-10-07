export interface ValidationResult {
  isValid: boolean;
  error?: string;
  format?: string;
  sizeBytes: number;
}

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Validates audio binary buffer by inspecting magic bytes:
 * - Bytes 0..3: 'RIFF' (0x52, 0x49, 0x46, 0x46)
 * - Bytes 8..11: 'WAVE' (0x57, 0x41, 0x56, 0x45)
 * Blocks disguised executables (PE Windows MZ: 0x4D 0x5A, ELF Linux: 0x7F 0x45 0x4C 0x46, Mach-O, scripts).
 */
export function inspectAudioMagicBytes(buffer: Buffer): ValidationResult {
  if (!buffer || buffer.length === 0) {
    return { isValid: false, error: 'Empty file payload received', sizeBytes: 0 };
  }

  if (buffer.length > MAX_PAYLOAD_BYTES) {
    return {
      isValid: false,
      error: `Payload size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 10 MB`,
      sizeBytes: buffer.length,
    };
  }

  if (buffer.length < 12) {
    return {
      isValid: false,
      error: 'File payload is too short to contain valid audio container headers',
      sizeBytes: buffer.length,
    };
  }

  // Check for malicious executable signatures
  // Windows PE (.exe, .dll) -> 'MZ' (0x4D, 0x5A)
  if (buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return {
      isValid: false,
      error: 'Security Violation: Disguised Windows executable binary detected (MZ header)',
      sizeBytes: buffer.length,
    };
  }

  // Linux ELF binary -> 0x7F 'E' 'L' 'F'
  if (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46) {
    return {
      isValid: false,
      error: 'Security Violation: Disguised ELF binary detected',
      sizeBytes: buffer.length,
    };
  }

  // Script shebang '#!' (0x23, 0x21)
  if (buffer[0] === 0x23 && buffer[1] === 0x21) {
    return {
      isValid: false,
      error: 'Security Violation: Disguised executable script detected',
      sizeBytes: buffer.length,
    };
  }

  // Verify RIFF header
  const riff = buffer.toString('ascii', 0, 4);
  const wave = buffer.toString('ascii', 8, 12);

  if (riff === 'RIFF' && wave === 'WAVE') {
    return {
      isValid: true,
      format: 'audio/wav',
      sizeBytes: buffer.length,
    };
  }

  return {
    isValid: false,
    error: `Invalid container format. Expected 'RIFF/WAVE' magic bytes, but found '${riff}/${wave}'`,
    sizeBytes: buffer.length,
  };
}
