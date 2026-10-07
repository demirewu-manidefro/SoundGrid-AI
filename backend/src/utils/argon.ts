import argon2 from 'argon2';

/**
 * Enterprise Argon2id Password Hasher
 * Uses Argon2id variant which provides defense against both side-channel and GPU attacks.
 */
export async function hashPassword(plainText: string): Promise<string> {
  return argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB memory
    timeCost: 3,         // 3 iterations
    parallelism: 1,
  });
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch (err) {
    return false;
  }
}
