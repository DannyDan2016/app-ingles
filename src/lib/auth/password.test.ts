import { describe, it, expect } from 'vitest';
import { validatePasswordPolicy, hashPassword, verifyPassword } from './password';

describe('validatePasswordPolicy', () => {
  it('rechaza menos de 12 caracteres', () => {
    expect(validatePasswordPolicy('a'.repeat(11))).toEqual({ ok: false, error: 'muy_corta' });
  });
  it('acepta 12 caracteres sin reglas de composición', () => {
    expect(validatePasswordPolicy('aaaaaaaaaaaa')).toEqual({ ok: true });
  });
  it('rechaza más de 128 caracteres (evita DoS del hash)', () => {
    expect(validatePasswordPolicy('a'.repeat(10_000))).toEqual({ ok: false, error: 'muy_larga' });
  });
  it('cuenta caracteres Unicode, no bytes', () => {
    expect(validatePasswordPolicy('ñ'.repeat(12))).toEqual({ ok: true });
  });
});

describe('hash argon2id', () => {
  it('verifica la contraseña correcta y rechaza otra', async () => {
    const hash = await hashPassword('contraseña-larga-1');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(await verifyPassword(hash, 'contraseña-larga-1')).toBe(true);
    expect(await verifyPassword(hash, 'contraseña-larga-2')).toBe(false);
  });
  it('devuelve false con un hash corrupto en vez de lanzar', async () => {
    expect(await verifyPassword('no-es-un-hash', 'x')).toBe(false);
  });
});
