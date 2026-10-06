import { hash, verify } from '@node-rs/argon2';

const MIN = 12;
const MAX = 128;
const ARGON2ID = 2; // valor de Algorithm.Argon2id (const enum ambiental, no importable con isolatedModules)
// Parámetros OWASP 2025 para argon2id: m=19 MiB, t=2, p=1
const OPTS = { algorithm: ARGON2ID, memoryCost: 19456, timeCost: 2, parallelism: 1 };

export function validatePasswordPolicy(plain: string): { ok: true } | { ok: false; error: 'muy_corta' | 'muy_larga' } {
  const len = [...plain].length;
  if (len < MIN) return { ok: false, error: 'muy_corta' };
  if (len > MAX) return { ok: false, error: 'muy_larga' };
  return { ok: true };
}

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTS);
}

export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashed, plain);
  } catch {
    return false;
  }
}

// Se verifica contra este hash cuando el alias no existe, para igualar el tiempo de respuesta.
export const DUMMY_HASH = hashPassword('dummy-password-para-tiempo-constante');
