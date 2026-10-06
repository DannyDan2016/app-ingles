import { argon2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const argon2Async = promisify(argon2);

const MIN = 12;
const MAX = 128;
// Parámetros OWASP 2025 para argon2id: m=19 MiB, t=2, p=1
const MEMORY = 19456;
const PASSES = 2;
const PARALLELISM = 1;
const TAG_LENGTH = 32;
const NONCE_LENGTH = 16;
// Cotas al verificar: evitan DoS por un hash manipulado con parámetros enormes.
const MAX_MEMORY = 65536;
const MAX_PASSES = 10;
const MAX_PARALLELISM = 4;

// Única fuente de normalización: iOS/macOS suelen enviar NFD y Windows NFC.
const normalizePassword = (plain: string) => plain.normalize('NFC');

export function validatePasswordPolicy(plain: string): { ok: true } | { ok: false; error: 'muy_corta' | 'muy_larga' } {
  const len = [...normalizePassword(plain)].length;
  if (len < MIN) return { ok: false, error: 'muy_corta' };
  if (len > MAX) return { ok: false, error: 'muy_larga' };
  return { ok: true };
}

function derive(plain: string, nonce: Buffer, memory: number, passes: number, parallelism: number, tagLength: number): Promise<Buffer> {
  return argon2Async('argon2id', { message: normalizePassword(plain), nonce, parallelism, tagLength, memory, passes });
}

const b64 = (b: Buffer) => b.toString('base64').replace(/=+$/, '');

export async function hashPassword(plain: string): Promise<string> {
  const nonce = randomBytes(NONCE_LENGTH);
  const tag = await derive(plain, nonce, MEMORY, PASSES, PARALLELISM, TAG_LENGTH);
  return `$argon2id$v=19$m=${MEMORY},t=${PASSES},p=${PARALLELISM}$${b64(nonce)}$${b64(tag)}`;
}

const PHC = /^\$argon2id\$v=19\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;

export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  try {
    const m = PHC.exec(hashed);
    if (!m) return false;
    const memory = Number(m[1]);
    const passes = Number(m[2]);
    const parallelism = Number(m[3]);
    if (memory < 8 * parallelism || memory > MAX_MEMORY) return false;
    if (passes < 1 || passes > MAX_PASSES) return false;
    if (parallelism < 1 || parallelism > MAX_PARALLELISM) return false;
    const nonce = Buffer.from(m[4], 'base64');
    const expected = Buffer.from(m[5], 'base64');
    if (nonce.length < 8 || expected.length < 4 || expected.length > 64) return false;
    const actual = await derive(plain, nonce, memory, passes, parallelism, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// Se verifica contra este hash cuando el alias no existe, para igualar el tiempo de respuesta.
export const DUMMY_HASH = hashPassword('dummy-password-para-tiempo-constante');
